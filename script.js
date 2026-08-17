"use strict";
/* ============================================================
   UTILITIES
   ============================================================ */
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;"); }
function imgFail(el) { el.style.display = 'none'; }
function sanitize(s) { return String(s).replace(/<[^>]*>/g, "").trim(); }
function isValidName(s) { return s.length >= 1 && s.length <= 30 && /^[^<>&"']+$/.test(s); }
var store = {
    get: function (k, fb) { try { var v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fb; } catch (e) { return fb; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
};
var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var tiltEnabled = store.get('tiltEnabled', !prefersReducedMotion);
var motionEnabled = store.get('motionEnabled', !prefersReducedMotion);

var toastTimer;
function showToast(msg) {
    var t = document.getElementById('toast');
    t.textContent = sanitize(msg);
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2800);
}
function shakeEl(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = '#ff7272';
    setTimeout(function () { el.style.borderColor = ''; el.focus(); }, 600);
}
function scrollToId(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function timeAgo(ts) {
    var d = Date.now() - ts, s = Math.floor(d / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    if (s < 2592000) return Math.floor(s / 86400) + 'd ago';
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fmtNum(n) {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
    return String(n);
}

/* ============================================================
   NOVEL DATA
   ============================================================ */
var novels = [
    {
        order: 1, title: "The Rain Pact", img: "./bg/rp.jpg", link: "./chapters/rpc.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 6, rating: 4.4, views: 10200, releaseOffsetDays: 900,
        blurb: "A story about the bonds we make, the promises we keep, and the rain that falls between us.", grad: "135deg,#3a2a3f,#5c3a4a", collections: ["best-romance", "completed"]
    },
    {
        order: 2, title: "Ten Percent of Forever", img: "./bg/tpof.jpg", link: "./chapters/tpof.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 7, rating: 4.7, views: 7600, releaseOffsetDays: 830,
        blurb: "If you only had ten percent of your time left to spend with the person you loved, how would you spend it?", grad: "135deg,#402a4a,#6a3a55", collections: ["best-romance", "completed", "editors-choice"]
    },
    {
        order: 3, title: "The Petal That Falls With a Smile Vol. 1", img: "./bg/tptfwas.jpg", link: "./chapters/tptfwas.html", genres: ["drama", "slice"], status: "completed", ch: 4, rating: 4.9, views: 21400, releaseOffsetDays: 770,
        blurb: "Life is a series of small smiles and falling petals. A gentle exploration of growing up and letting go.", grad: "135deg,#2f4a42,#3a6a55", collections: ["completed", "editors-choice"]
    },
    {
        order: 4, title: "The Day She Stayed", img: "./bg/tdss.jpg", link: "./chapters/tdss.html", genres: ["romance", "drama", "sad"], status: "completed", ch: 11, rating: 4.6, views: 9100, releaseOffsetDays: 700,
        blurb: "She was only supposed to stay for the day. But some days last a lifetime in our memories.", grad: "135deg,#2a3a4a,#3a5468", collections: ["completed", "editors-choice"]
    },
    {
        order: 5, title: "Him and Her", img: "./bg/hah.jpg", link: "./chapters/hah.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 5, rating: 4.5, views: 5300, releaseOffsetDays: 640,
        blurb: "A simple story about him, her, and the quiet spaces between their words.", grad: "135deg,#4a3a2a,#6a5230", collections: ["best-romance", "completed"]
    },
    {
        order: 6, title: "Case File: You", img: "./bg/cfy.jpg", link: "./chapters/cfy.html", genres: ["mystery", "drama", "action"], status: "ongoing", ch: 10, rating: 4.4, views: 4200, releaseOffsetDays: 570,
        blurb: "A mystery that begins with a single file. Who are you, really, when the world isn't looking?", grad: "135deg,#3a2a4a,#5a2a30", collections: ["editors-choice"]
    },
    {
        order: 7, title: "The Other Side of Rain", img: "./bg/tosor.jpg", link: "./chapters/tosor.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 5, rating: 4.7, views: 6100, releaseOffsetDays: 520, updatedDaysAgo: 1,
        blurb: "The rain didn't stop when the story ended. A companion piece to the emotional journey of The Rain Pact.", grad: "135deg,#2a3a4a,#3a5468", collections: ["best-romance", "completed"]
    },
    {
        order: 8, title: "The Petal That Falls With a Smile Vol. 2", img: "./bg/tptfwasv2.jpg", link: "./chapters/tptfwasv2.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 5, rating: 4.8, views: 18200, releaseOffsetDays: 460,
        blurb: "Spring returns, and with it, new stories of love and loss in the second volume of the Petal series.", grad: "135deg,#4a2a3a,#6a3a4e", collections: ["completed"]
    },
    {
        order: 9, title: "The Girl Who Was Deleted", img: "./bg/os.jpg", link: "./chapters/os.html", genres: ["mystery", "drama", "slice"], status: "completed", ch: 1, rating: 4.3, views: 2100, releaseOffsetDays: 400,
        blurb: "What happens to the digital ghosts we leave behind? A mystery wrapped in a slice-of-life shell.", grad: "135deg,#2a3a4a,#3a5468", collections: ["hidden-gems", "completed"]
    },
    {
        order: 10, title: "Him and Her Vol. 2", img: "./bg/hahv2.jpg", link: "./chapters/hahv2.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 4, rating: 4.5, views: 3800, releaseOffsetDays: 340,
        blurb: "Continuing the journey of Him and Her into a new chapter of their lives.", grad: "135deg,#4a3a2a,#6a5230", collections: ["completed"]
    },
    {
        order: 11, title: "The Petal That Falls With a Smile Vol. 3 ", img: "./bg/tptfwasv3.jpg", link: "./chapters/tptfwasv3.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 9, rating: 4.7, views: 18700, releaseOffsetDays: 270, updatedDaysAgo: 0.2,
        blurb: "The petals continue to fall as we enter the third volume of this heartwarming saga.", grad: "135deg,#4a2a3a,#6a3a4e", collections: ["best-romance", "newest"]
    },
    {
        order: 12, title: "Second Place Forever", img: "./bg/os2.jpg", link: "./chapters/os2.html", genres: ["sad", "drama", "slice"], status: "completed", ch: 1, rating: 4.6, views: 1800, releaseOffsetDays: 220,
        blurb: "Coming in second isn't always losing. A poignant one-shot about the beauty of being enough.", grad: "135deg,#2a3a4a,#3a5468", collections: ["hidden-gems", "completed"]
    },
    {
        order: 13, title: "The Hours I Sold", img: "./bg/this.jpg", link: "./chapters/this.html", genres: ["drama", "slice"], status: "completed", ch: 1, rating: 4.5, views: 1500, releaseOffsetDays: 170,
        blurb: "If time was a currency, how much would you pay for a single hour of the past?", grad: "135deg,#3a2a2a,#5a3a30", collections: ["hidden-gems", "completed"]
    },
    {
        order: 14, title: "Before I Forget Your Name", img: "./bg/bikyn.jpg", link: "./chapters/bikyn.html", genres: ["romance", "drama", "slice", "sad"], status: "ongoing", ch: 1, rating: 5.0, views: 3400, releaseOffsetDays: 46, updatedDaysAgo: 0.08,
        blurb: "An emotional rollercoaster that explores the fragility of memory and love.", grad: "135deg,#4a2a3a,#6a3a4e", collections: ["newest"]
    },
    {
        order: 15, title: "The Petal That Falls With a Smile — Manga Version", img: "./bg/tptfwas-manga.jpg", link: "./chapters/tptfwas-manga.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 1, rating: null, views: 2100, releaseOffsetDays: 0,
        blurb: "A manga adaptation of the beloved novel, illustrated with the same tenderness that made the original a favorite.", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["newest"]
    },
    {
        order: 16, title: "The Rain Pact - Manga Version", img: "./bg2/trp-manga.jpg", link: "#", genres: ["romance", "drama", "slice"], status: "upcoming", ch: 0, rating: null, views: 0, releaseOffsetDays: -15,
        blurb: "A manga adaptation of the beloved novel, illustrated with the same tenderness that made the original a favorite.", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["newest"]
    },
    {
        order: 17, title: "The Bell That Rang for the Dead", img: "./bg2/osn.jpg", link: "./chapters/osn.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 1, rating: 4.0, views: 1100, releaseOffsetDays: 0,
        blurb: "ONE SHOT.", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["newest"]
    }
];
var badgeLabel = { romance: "Romance", drama: "Drama", slice: "Slice", sad: "Sad", mystery: "Mystery", action: "Action" };
function nowMs() { return Date.now(); }
function releaseDate(n) { return new Date(nowMs() - n.releaseOffsetDays * 86400000); }
function lastUpdate(n) { return new Date(nowMs() - (n.updatedDaysAgo != null ? n.updatedDaysAgo : n.releaseOffsetDays) * 86400000); }
function likes(n) { return Math.round(n.views * 0.11); }
function commentsCount(n) { return Math.round(n.views * 0.01) + 2; }
function words(n) { return n.ch * 1850; }
function coverHtml(n, cls) {
    return '<div class="' + cls + '" style="background:linear-gradient(' + n.grad + ')"><img src="' + esc(n.img) + '" alt="" loading="lazy" onerror="imgFail(this)"></div>';
}

/* ============================================================
   READING PROGRESS / STORAGE STATE
   ============================================================ */
var readProgress = store.get('readProgress', {});
var bookmarks = store.get('bookmarks', {});
var currentlyReadingOrder = store.get('currentlyReading', null);
var readingLog = store.get('readingLog', {});
var claimedChallenges = store.get('claimedChallenges', {});

function getRead(n) { var v = readProgress[n.order]; return typeof v === 'number' ? Math.max(0, Math.min(v, n.ch)) : 0; }
function logReadingActivity(delta) {
    if (delta <= 0) return;
    var key = new Date().toISOString().slice(0, 10);
    readingLog[key] = (readingLog[key] || 0) + delta;
    store.set('readingLog', readingLog);
}
function adjustProgress(order, delta) {
    var n = novels.find(function (x) { return x.order === order; });
    if (!n) return;
    var cur = getRead(n), next = Math.max(0, Math.min(cur + delta, n.ch));
    if (next === cur) return;
    readProgress[order] = next;
    store.set('readProgress', readProgress);
    if (delta > 0) logReadingActivity(delta);
    if (next === n.ch && cur !== n.ch) showToast(n.title + ' — all caught up! ✦');
    refreshReadingUI();
}

/* ============================================================
   AURORA / MOOD
   ============================================================ */
var moodColors = {
    all: ['#ff7d9c', '#a78bfa'], romance: ['#ff7d9c', '#ffc46b'], sad: ['#7fa8d6', '#a78bfa'],
    mystery: ['#a78bfa', '#ff7272'], slice: ['#68d8c4', '#74d3a4']
};
var auroraActive = 1;
function paintAurora(colors) {
    var next = auroraActive === 1 ? 2 : 1;
    var layer = document.getElementById('auroraLayer' + next);
    var prev = document.getElementById('auroraLayer' + auroraActive);
    layer.style.background =
        'radial-gradient(circle at 20% 25%, ' + colors[0] + ' 0%, transparent 45%),' +
        'radial-gradient(circle at 80% 20%, ' + colors[1] + ' 0%, transparent 40%),' +
        'radial-gradient(circle at 50% 80%, ' + colors[0] + ' 0%, transparent 50%)';
    layer.classList.add('on');
    prev.classList.remove('on');
    auroraActive = next;
}

/* ============================================================
   COLOR THEMES
   ============================================================ */
var themeAccents = {
    rose: ['#ff7d9c', '#a78bfa'],
    blue: ['#5b9dff', '#a78bfa'],
    red: ['#ff6b6b', '#ffc46b'],
    violet: ['#a78bfa', '#ff7d9c'],
    gold: ['#ffc46b', '#ff7d9c'],
    teal: ['#68d8c4', '#a78bfa']
};
function setTheme(theme) {
    if (!themeAccents[theme]) theme = 'rose';
    if (theme === 'rose') document.body.removeAttribute('data-theme');
    else document.body.setAttribute('data-theme', theme);
    store.set('theme', theme);
    document.querySelectorAll('.theme-swatch').forEach(function (s) {
        var active = s.dataset.theme === theme;
        s.classList.toggle('active', active);
        s.setAttribute('aria-checked', String(active));
    });
    moodColors.all = themeAccents[theme];
    var activeMoodCard = document.querySelector('.mood-card.active');
    var moodKey = activeMoodCard ? activeMoodCard.dataset.mood : 'all';
    if (moodKey === 'all') paintAurora(themeAccents[theme]);
    showToast('Theme set to ' + theme.charAt(0).toUpperCase() + theme.slice(1) + ' ✦');
}
function initTheme() {
    var saved = store.get('theme', 'rose');
    if (!themeAccents[saved]) saved = 'rose';
    if (saved !== 'rose') document.body.setAttribute('data-theme', saved);
    document.querySelectorAll('.theme-swatch').forEach(function (s) {
        var active = s.dataset.theme === saved;
        s.classList.toggle('active', active);
        s.setAttribute('aria-checked', String(active));
    });
    moodColors.all = themeAccents[saved];
}

/* ============================================================
   3D TILT
   ============================================================ */
function attachTilt(el) {
    if (!tiltEnabled) return;
    el.addEventListener('mousemove', function (e) {
        if (!tiltEnabled) return;
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(700px) rotateY(' + (px * 8) + 'deg) rotateX(' + (-py * 8) + 'deg) translateY(-4px)';
    });
    el.addEventListener('mouseleave', function () { el.style.transform = ''; });
}

/* ============================================================
   HERO — TRENDING CAROUSEL / CONTINUE READING / AUTHOR CARD
   ============================================================ */
var heroFeaturedList = [];
var heroFeaturedIndex = 0;
var heroRotateTimer = null;

function renderHero() {
    heroFeaturedList = novels
        .filter(function (n) { return n.status !== 'upcoming' && n.ch > 0; })
        .slice()
        .sort(function (a, b) { return b.views - a.views; })
        .slice(0, 3);
    if (!heroFeaturedList.length) return;

    heroFeaturedIndex = 0;
    paintHeroFeature(0, false);
    buildHeroDots();
    startHeroRotate();

    var wrap = document.getElementById('heroFeature');
    if (wrap && !wrap.dataset.hoverBound) {
        wrap.addEventListener('mouseenter', function () { clearInterval(heroRotateTimer); });
        wrap.addEventListener('mouseleave', function () { startHeroRotate(); });
        wrap.dataset.hoverBound = '1';
    }

    refreshReadingUI();
}
function paintHeroFeature(i, animate) {
    var n = heroFeaturedList[i];
    if (!n) return;
    var imgEl = document.getElementById('heroFeatureImg');
    if (animate) {
        imgEl.style.opacity = '0';
        setTimeout(function () { imgEl.src = n.img; imgEl.style.opacity = '.5'; }, 260);
    } else {
        imgEl.src = n.img;
    }
    var vol = (n.title.match(/Vol\.?\s*(\d+)/i) || [])[1];
    var textEl = document.getElementById('heroFeatureText');
    textEl.innerHTML =
        '<span class="trend-badge">🔥 Trending Now' + (vol ? ' · Vol. ' + vol : '') + '</span>' +
        '<h1 class="hero-feature-title">' + esc(n.title.trim()) + '</h1>' +
        '<p class="hero-feature-desc">' + esc(n.blurb) + '</p>' +
        '<div class="hero-meta-row"><span>' + (n.rating ? ('⭐ ' + n.rating + ' rating') : '⭐ New') + '</span>' +
        '<span>👁 ' + fmtNum(n.views) + ' readers</span>' +
        '<span>📖 ' + n.ch + ' chapter' + (n.ch === 1 ? '' : 's') + '</span>' +
        '<span style="color: var(--rose)">' + (n.status === 'ongoing' ? 'Ongoing' : 'Completed') + '</span></div>';
    if (animate) { textEl.classList.remove('hero-fade'); void textEl.offsetWidth; textEl.classList.add('hero-fade'); }

    var startBtn = document.getElementById('heroStartBtn');
    if (startBtn) startBtn.onclick = function () { openSpotlight(n.order); };

    document.querySelectorAll('.hero-trend-dot').forEach(function (d, di) { d.classList.toggle('active', di === i); });
}
function buildHeroDots() {
    var wrap = document.getElementById('heroTrendDots');
    if (!wrap) return;
    wrap.innerHTML = heroFeaturedList.map(function (n, i) {
        return '<button class="hero-trend-dot' + (i === 0 ? ' active' : '') + '" aria-label="Show ' + esc(n.title.trim()) + '" onclick="jumpHeroFeature(' + i + ')"></button>';
    }).join('');
}
function jumpHeroFeature(i) {
    heroFeaturedIndex = i;
    paintHeroFeature(i, true);
    startHeroRotate();
}
function advanceHeroFeature() {
    heroFeaturedIndex = (heroFeaturedIndex + 1) % heroFeaturedList.length;
    paintHeroFeature(heroFeaturedIndex, true);
}
function startHeroRotate() {
    clearInterval(heroRotateTimer);
    if (motionEnabled && heroFeaturedList.length > 1) {
        heroRotateTimer = setInterval(advanceHeroFeature, 6000);
    }
}
/* ============================================================
   READING STREAK
   ============================================================ */
function dateKey(d) { return d.toISOString().slice(0, 10); }
function computeStreak() {
    var d = new Date();
    if (!readingLog[dateKey(d)]) d.setDate(d.getDate() - 1); // streak isn't broken until a day passes with no read
    var count = 0;
    while (readingLog[dateKey(d)]) { count++; d.setDate(d.getDate() - 1); }
    return count;
}
function computeBestStreak() {
    var keys = Object.keys(readingLog).filter(function (k) { return readingLog[k] > 0; }).sort();
    if (!keys.length) return 0;
    var best = 1, run = 1;
    for (var i = 1; i < keys.length; i++) {
        var diffDays = Math.round((new Date(keys[i]) - new Date(keys[i - 1])) / 86400000);
        run = diffDays === 1 ? run + 1 : 1;
        if (run > best) best = run;
    }
    return best;
}
function renderReaderStreak() {
    var streak = computeStreak(), best = computeBestStreak();
    var chip = document.getElementById('readerStreakChip');
    if (chip) {
        chip.innerHTML = '🔥 ' + streak + '-day streak';
        chip.title = 'Best streak: ' + best + (best === 1 ? ' day' : ' days');
    }
    var note = document.getElementById('heatmapStreakNote');
    if (note) {
        note.textContent = (streak > 0 ? streak + '-day streak' : 'No active streak') +
            ' · best ' + best + (best === 1 ? ' day' : ' days');
    }
}

function refreshReadingUI() {
    renderContinueReading();
    renderProgressJourney();
    renderChallenges();
    renderCatalog();
    renderReaderAchievements();
    renderHeatmap();
    renderReaderStreak();
}
function renderContinueReading() {
    var body = document.getElementById('crBody');
    var n = currentlyReadingOrder && novels.find(function (x) { return x.order === currentlyReadingOrder; });
    if (!n) { body.innerHTML = '<div class="cr-empty">You have not started a story yet. Pick one from The Shelf and it will show up here, like a bookmark that remembers you.</div>'; return; }
    var read = getRead(n), pct = n.ch ? Math.round(read / n.ch * 100) : 0;
    body.innerHTML =
        '<div class="cr-thumb-row"><div class="cr-thumb">' + coverHtml(n, '').replace('<div class=""', '<div style="width:100%;height:100%"') + '</div>' +
        '<div class="cr-info"><div class="cr-title">' + esc(n.title) + '</div>' +
        '<div class="cr-bar"><div class="cr-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="cr-sub">' + read + ' / ' + n.ch + ' chapters · ' + pct + '%</div></div></div>' +
        '<button class="cr-btn" id="crContinueBtn">Continue Reading →</button>';
    document.getElementById('crContinueBtn').onclick = function () { window.location.href = n.link; };
}

/* ============================================================
   STATS STRIP
   ============================================================ */
function computeLibraryStats() {
    var released = novels.filter(function (n) { return n.status !== 'upcoming'; });
    var totalCh = released.reduce(function (a, n) { return a + n.ch; }, 0);
    var totalWords = released.reduce(function (a, n) { return a + words(n); }, 0);
    var totalViews = released.reduce(function (a, n) { return a + n.views; }, 0);
    var avgRating = released.reduce(function (a, n) { return a + n.rating; }, 0) / released.length;
    var ongoing = novels.filter(function (n) { return n.status === 'ongoing'; }).length;
    return { novels: novels.length, chapters: totalCh, words: totalWords, views: totalViews, avgRating: avgRating.toFixed(1), ongoing: ongoing };
}
function animateCount(el, target, isFloat, suffix) {
    var start = 0, dur = 1200, t0 = null;
    function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var val = start + (target - start) * (1 - Math.pow(1 - p, 3));
        el.textContent = (isFloat ? val.toFixed(1) : Math.round(val).toLocaleString()) + (suffix || '');
        if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}
function renderStats() {
    var s = computeLibraryStats();
    var tiles = [
        { label: 'Titles', val: s.novels, suffix: '' },
        { label: 'Chapters', val: s.chapters, suffix: '+' },
        { label: 'Words Written', val: Math.round(s.words / 1000), suffix: 'k' },
        { label: 'Total Views', val: Math.round(s.views / 1000), suffix: 'k' },
        { label: 'Avg Rating', val: s.avgRating, suffix: '', isFloat: true },
        { label: 'Ongoing Now', val: s.ongoing, suffix: '' }
    ];
    var grid = document.getElementById('statsGrid');
    grid.innerHTML = tiles.map(function (t, i) {
        return '<div class="glass stat-tile" data-target="' + t.val + '" data-suffix="' + t.suffix + '" data-float="' + (!!t.isFloat) + '">' +
            '<div class="stat-num" id="statNum' + i + '">0</div><div class="stat-label">' + esc(t.label) + '</div>' +
            (i < 3 ? '<div class="stat-growth">▲ growing weekly</div>' : '') + '</div>';
    }).join('');
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            if (en.isIntersecting) {
                var idx = Array.prototype.indexOf.call(grid.children, en.target);
                var t = tiles[idx];
                animateCount(document.getElementById('statNum' + idx), t.val, t.isFloat, t.suffix);
                io.unobserve(en.target);
            }
        });
    }, { threshold: .4 });
    Array.prototype.forEach.call(grid.children, function (c) { io.observe(c); });
}

/* ============================================================
   MOOD PICKER
   ============================================================ */
var activeMoodGenres = null;
function pickMood(el, genreStr) {
    document.querySelectorAll('.mood-card').forEach(function (c) { c.classList.remove('active'); });
    el.classList.add('active');
    var key = el.dataset.mood;
    paintAurora(moodColors[key] || moodColors.all);
    activeMoodGenres = genreStr === 'all' ? null : genreStr.split(' ');
    document.querySelectorAll('#genrePills .pill-btn').forEach(function (p) { p.classList.remove('active'); });
    document.querySelector('#genrePills .pill-btn[data-genre="all"]').classList.add('active');
    activeGenre = 'all';
    renderCatalog();
    scrollToId('catalog');
    showToast('Showing ' + el.querySelector('.mood-label').textContent + ' reads ✦');
}

/* ============================================================
   CATALOG (THE SHELF)
   ============================================================ */
var activeGenre = 'all', activeStatus = 'all';
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('genrePills').addEventListener('click', function (e) {
        var btn = e.target.closest('.pill-btn'); if (!btn) return;
        this.querySelectorAll('.pill-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active'); activeGenre = btn.dataset.genre || 'all'; activeMoodGenres = null;
        document.querySelectorAll('.mood-card').forEach(function (c) { c.classList.remove('active'); });
        document.querySelector('.mood-card[data-mood="all"]').classList.add('active');
        renderCatalog();
    });
    document.getElementById('statusPills').addEventListener('click', function (e) {
        var btn = e.target.closest('.pill-btn'); if (!btn) return;
        this.querySelectorAll('.pill-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active'); activeStatus = btn.dataset.status || 'all'; renderCatalog();
    });
    document.getElementById('lbTabs').addEventListener('click', function (e) {
        var btn = e.target.closest('.pill-btn'); if (!btn) return;
        this.querySelectorAll('.pill-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active'); renderLeaderboard(btn.dataset.lb);
    });
});
function renderCatalog() {
    var grid = document.getElementById('catalogGrid');
    var q = sanitize(document.getElementById('shelfSearch').value).toLowerCase();
    var filtered = novels.filter(function (n) {
        var matchesMood = !activeMoodGenres || activeMoodGenres.some(function (g) { return n.genres.indexOf(g) > -1; });
        var matchesQ = !q || n.title.toLowerCase().indexOf(q) > -1 || n.genres.join(' ').indexOf(q) > -1;
        var matchesGenre = activeGenre === 'all' || n.genres.indexOf(activeGenre) > -1;
        var matchesStatus = activeStatus === 'all' || n.status === activeStatus;
        return matchesMood && matchesQ && matchesGenre && matchesStatus;
    }).sort(function (a, b) { return b.order - a.order; });
    document.getElementById('shelfCount').textContent = filtered.length + ' stories, filed and ready to open.';
    grid.innerHTML = filtered.map(function (n, i) {
        var read = getRead(n), pct = n.ch ? Math.round(read / n.ch * 100) : 0;
        var statusCls = n.status === 'ongoing' ? 'status-ongoing' : n.status === 'upcoming' ? 'status-upcoming' : 'status-completed';
        var isLiked = !!bookmarks[n.order];
        return '<div class="novel-card" style="animation-delay:' + (i * 0.03) + 's" onclick="openSpotlight(' + n.order + ')">' +
            '<div class="nc-cover">' + coverHtml(n, '').replace('<div class=""', '<div style="width:100%;height:100%"') +
            '<div class="nc-grad"></div>' +
            '<span class="nc-status ' + statusCls + '">' + n.status + '</span>' +
            '<div class="nc-quickrow">' +
            '<button class="nc-qbtn' + (isLiked ? ' liked' : '') + '" onclick="event.stopPropagation();toggleLikeNovel(' + n.order + ')" aria-label="Like">' + (isLiked ? '♥' : '♡') + '</button>' +
            '<button class="nc-qbtn" onclick="event.stopPropagation();shareNovelQuick(' + n.order + ')" aria-label="Share">↗</button>' +
            '</div>' +
            '<div class="nc-body"><div class="nc-genres">' + n.genres.map(function (g) { return '<span class="nc-tag">' + badgeLabel[g] + '</span>'; }).join('') + '</div>' +
            '<div class="nc-title">' + esc(n.title) + '</div>' +
            '<div class="nc-meta"><span>' + (n.rating ? ('⭐ ' + n.rating) : '—') + '</span><span>👁 ' + fmtNum(n.views) + '</span><span>📖 ' + (n.ch || '0') + ' ch</span></div>' +
            (n.ch ? '<div class="nc-progress"><div class="nc-progress-fill" style="width:' + pct + '%"></div></div><div class="nc-progress-label">' + read + ' / ' + n.ch + ' read</div>' : '<div class="nc-progress-label">Releasing soon</div>') +
            '</div></div></div>';
    }).join('');
    Array.prototype.forEach.call(grid.querySelectorAll('.novel-card'), attachTilt);
    populateCommentSelect();
}
function toggleLikeNovel(order) {
    bookmarks[order] = !bookmarks[order];
    store.set('bookmarks', bookmarks);
    showToast(bookmarks[order] ? 'Added to your favorites ♥' : 'Removed from favorites');
    renderCatalog();
}
function shareNovelQuick(order) {
    var n = novels.find(function (x) { return x.order === order; });
    var url = window.location.href.split('#')[0] + (n.link || '');
    if (navigator.clipboard) { navigator.clipboard.writeText(url).catch(function () { }); }
    showToast('Link copied for "' + n.title + '" ↗');
}

/* ============================================================
   SPOTLIGHT PANEL
   ============================================================ */
var spotlightOrder = null;
function openSpotlight(order) {
    var n = novels.find(function (x) { return x.order === order; });
    if (!n) return;
    spotlightOrder = order;
    var bg = document.getElementById('spCoverBg');
    bg.style.background = 'linear-gradient(' + n.grad + ')';
    bg.innerHTML = '<img src="' + esc(n.img) + '" style="width:100%;height:100%;object-fit:cover;opacity:.85" onerror="imgFail(this)">';
    var statusCls = n.status === 'ongoing' ? 'status-ongoing' : n.status === 'upcoming' ? 'status-upcoming' : 'status-completed';
    document.getElementById('spStatusRow').innerHTML = n.genres.map(function (g) { return '<span class="nc-tag" style="color:var(--ink);border-color:var(--panel-border-strong)">' + badgeLabel[g] + '</span>'; }).join('') +
        '<span class="nc-tag ' + statusCls + '" style="border:none">' + n.status + '</span>';
    document.getElementById('spTitle').textContent = n.title;
    document.getElementById('spByline').textContent = 'A Novel by AKA · ⭐ ' + (n.rating || '—') + ' · 👁 ' + fmtNum(n.views);
    document.getElementById('spDesc').textContent = n.blurb;
    var read = getRead(n), pct = n.ch ? Math.round(read / n.ch * 100) : 0;
    document.getElementById('spFill').style.width = pct + '%';
    document.getElementById('spChRead').textContent = read + ' / ' + n.ch + ' chapters read';
    document.getElementById('spMinus').disabled = read === 0;
    document.getElementById('spPlus').disabled = read >= n.ch;
    var chList = document.getElementById('spChapterList');
    var html = '';
    var isOneShot = n.ch === 1;
    for (var i = 1; i <= Math.min(n.ch, 10); i++) {
        var isRead = i <= read;
        var cName = isOneShot ? 'One Shot' : 'Chapter ' + i;
        html += '<a class="sp-ch-item" href="' + (n.link || '#') + '"><div class="sp-ch-num' + (isRead ? ' read' : '') + '">' + (isRead ? '✓' : i) + '</div><span style="flex:1">' + cName + '</span>' +
            (isRead ? '<span style="font-size:10px;color:var(--sage)">Read</span>' : '<span style="font-size:10px;color:var(--muted)">→</span>') + '</a>';
    }
    if (n.ch > 10) html += '<div style="text-align:center;font-family:var(--font-mono);font-size:10px;color:var(--muted);padding:6px">+ ' + (n.ch - 10) + ' more chapters</div>';
    if (n.ch === 0) html = '<div style="text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--muted);padding:10px">Chapters land here on release day.</div>';
    chList.innerHTML = html;
    var bbtn = document.getElementById('spBookmarkBtn');
    if (currentlyReadingOrder === order) { bbtn.textContent = '✓ Currently Reading'; bbtn.classList.add('active'); }
    else { bbtn.textContent = '🔖 Set as Currently Reading'; bbtn.classList.remove('active'); }
    document.getElementById('spReadBtn').textContent = (read > 0 && read < n.ch) ? 'Continue Reading →' : 'Start Reading →';
    document.getElementById('spotlightOverlay').classList.add('open');
    document.getElementById('spotlightPanel').classList.add('open');
}
function closeSpotlight() {
    document.getElementById('spotlightOverlay').classList.remove('open');
    document.getElementById('spotlightPanel').classList.remove('open');
    spotlightOrder = null;
}
function spAdjust(delta) { if (spotlightOrder === null) return; adjustProgress(spotlightOrder, delta); openSpotlight(spotlightOrder); }
function goToNovel() { var n = novels.find(function (x) { return x.order === spotlightOrder; }); if (n && n.link) window.location.href = n.link; }
function toggleBookmark() {
    if (!spotlightOrder) return;
    if (currentlyReadingOrder === spotlightOrder) { currentlyReadingOrder = null; store.set('currentlyReading', null); showToast('Bookmark removed.'); }
    else {
        currentlyReadingOrder = spotlightOrder; store.set('currentlyReading', spotlightOrder);
        var n = novels.find(function (x) { return x.order === spotlightOrder; }); showToast((n ? n.title : 'Novel') + ' set as currently reading 🔖');
    }
    refreshReadingUI();
    openSpotlight(spotlightOrder);
}
function shareNovel() { if (spotlightOrder) shareNovelQuick(spotlightOrder); }

/* ============================================================
   READING CHALLENGES
   ============================================================ */
function chaptersInLastDays(days) {
    var total = 0, now = new Date();
    for (var i = 0; i < days; i++) {
        var d = new Date(now); d.setDate(d.getDate() - i);
        var key = d.toISOString().slice(0, 10);
        total += readingLog[key] || 0;
    }
    return total;
}
function totalRead() { return novels.reduce(function (a, n) { return a + getRead(n); }, 0); }
function completedCount() { return novels.filter(function (n) { return n.ch > 0 && getRead(n) >= n.ch; }).length; }
function renderChallenges() {
    var weekCh = chaptersInLastDays(7);
    var monthDone = completedCount();
    var challenges = [
        { id: 'weekly', title: 'Turn 10 Pages', sub: 'Read 10 chapters this week', target: 10, cur: Math.min(weekCh, 10), xp: 150 },
        { id: 'monthly', title: 'Finish a Full Story', sub: 'Complete one novel', target: 1, cur: Math.min(monthDone, 1), xp: 400 },
        { id: 'variety', title: 'Genre Explorer', sub: 'Read from 3 different genres', target: 3, cur: Math.min(genresTouched(), 3), xp: 200 }
    ];
    document.getElementById('challengesList').innerHTML = challenges.map(function (c) {
        var pct = Math.round(c.cur / c.target * 100);
        var done = c.cur >= c.target;
        return '<div class="challenge-item"><div class="challenge-title"><span>' + c.title + '</span><span class="challenge-xp">+' + c.xp + ' XP</span></div>' +
            '<div class="challenge-bar"><div class="challenge-fill" style="width:' + pct + '%' + (done ? ';background:var(--gold)' : '') + '"></div></div>' +
            '<div class="challenge-sub">' + c.sub + ' · ' + c.cur + '/' + c.target + (done ? ' · Complete ✓' : '') + '</div></div>';
    }).join('');
}
function genresTouched() {
    var set = {};
    novels.forEach(function (n) { if (getRead(n) > 0) n.genres.forEach(function (g) { set[g] = true; }); });
    return Object.keys(set).length;
}

/* ============================================================
   READER ACHIEVEMENTS
   ============================================================ */
function renderProgressJourney() {
    var tr = totalRead();
    var rank = 'Novice Reader';
    if (tr >= 50) rank = 'Legendary Librarian'; else if (tr >= 20) rank = 'Dedicated Scholar'; else if (tr >= 5) rank = 'Avid Reader';
    document.getElementById('journeyRank').textContent = rank;
    var s = computeReaderStats();
    var unlockedCount = readerAchievementDefs.filter(function (a) { return a.metric(s) >= a.target; }).length;
    document.getElementById('journeyStats').textContent = unlockedCount + ' / ' + readerAchievementDefs.length + ' badges earned';
}
function weekendReadFlag() {
    var found = false;
    Object.keys(readingLog).forEach(function (k) {
        var day = new Date(k + 'T00:00:00').getDay();
        if (day === 0 || day === 6) found = true;
    });
    return found ? 1 : 0;
}
function computeReaderStats() {
    return {
        read: totalRead(),
        genres: genresTouched(),
        completed: completedCount(),
        week: chaptersInLastDays(7),
        bookmarked: currentlyReadingOrder ? 1 : 0,
        weekend: weekendReadFlag(),
        oneDay: store.get('oneDayRead', 0)
    };
}
var readerAchievementDefs = [
    { icon: '📖', title: 'First Stamp', hint: 'Read your first chapter', rarity: 'common', metric: function (s) { return s.read; }, target: 1 },
    { icon: '🔖', title: 'Bookmarked', hint: 'Set a novel as Currently Reading', rarity: 'common', metric: function (s) { return s.bookmarked; }, target: 1 },
    { icon: '🌈', title: 'Shelf Hopper', hint: 'Read from 3 different genres', rarity: 'common', metric: function (s) { return s.genres; }, target: 3 },
    { icon: '🏆', title: 'Full Return', hint: 'Finish a novel start to finish', rarity: 'rare', metric: function (s) { return s.completed; }, target: 1 },
    { icon: '⚡', title: 'Marathoner', hint: 'Read 10+ chapters in a single week', rarity: 'rare', metric: function (s) { return s.week; }, target: 10 },
    { icon: '🌅', title: 'Weekend Reader', hint: 'Read on a Saturday or Sunday', rarity: 'rare', metric: function (s) { return s.weekend; }, target: 1 },
    { icon: '🔥', title: 'Bookworm', hint: 'Read 45+ chapters total', rarity: 'epic', metric: function (s) { return s.read; }, target: 45 },
    { icon: '👑', title: 'Genre Omnivore', hint: 'Read from all 6 genres', rarity: 'legendary', metric: function (s) { return s.genres; }, target: 6 },
    { icon: '🎯', title: 'One-Day Read', hint: 'Finish a novel in a single day', rarity: 'UPCOMING SOON!', metric: function (s) { return s.oneDay; }, target: 1 },
    { icon: '🏅', title: 'Completionist', hint: 'finish 3 novels start to finish', rarity: 'UPCOMING SOON!', metric: function (s) { return s.oneDay; }, target: 3 },
];
var readerAchUnlocks = store.get('readerAchUnlocks', {});
function renderReaderAchievements() {
    var s = computeReaderStats();
    var grid = document.getElementById('achievementGrid');
    if (!grid) return;
    grid.innerHTML = readerAchievementDefs.map(function (a, idx) {
        var cur = a.metric(s);
        var pct = Math.min(100, Math.round(cur / a.target * 100));
        var unlocked = cur >= a.target;
        if (unlocked && !readerAchUnlocks[idx]) { readerAchUnlocks[idx] = new Date().toISOString(); store.set('readerAchUnlocks', readerAchUnlocks); }
        var dateLabel = unlocked && readerAchUnlocks[idx] ? new Date(readerAchUnlocks[idx]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
        return '<div class="glass milestone-tile' + (unlocked ? ' unlocked' : '') + '">' +
            '<div class="m-icon-row"><div class="m-icon">' + a.icon + '</div><span class="rarity-tag rarity-' + a.rarity + '">' + a.rarity + '</span></div>' +
            '<div class="m-title">' + a.title + '</div><div class="m-hint">' + a.hint + '</div>' +
            '<div class="m-progress-row"><span>' + (unlocked ? 'Complete' : pct + '%') + '</span><span>' + fmtNum(Math.min(cur, a.target)) + ' / ' + fmtNum(a.target) + '</span></div>' +
            '<div class="m-bar"><div class="m-fill" style="width:' + pct + '%"></div></div>' +
            '<div class="m-footer">' + (unlocked ? '<span class="m-date">Unlocked ' + dateLabel + '</span>' : '<span class="m-date" style="color:var(--muted)">Locked</span>') +
            '<button class="m-share" onclick="shareReaderAch(' + idx + ')" aria-label="Share achievement">↗</button></div></div>';
    }).join('');
}
function shareReaderAch(idx) {
    var a = readerAchievementDefs[idx];
    if (!a) return;
    var s = computeReaderStats();
    var unlocked = a.metric(s) >= a.target;
    showToast(unlocked ? ('"' + a.title + '" copied to share ↗') : 'Keep reading to unlock this one ✦');
}

/* ============================================================
   SURPRISE ME — WEIGHTED RANDOM PICK
   ============================================================ */
var lastSurpriseOrder = null;
function surpriseMe() {
    var touched = {};
    novels.forEach(function (n) { if (getRead(n) > 0) n.genres.forEach(function (g) { touched[g] = true; }); });

    var pool = novels.filter(function (n) { return n.status !== 'upcoming' && n.ch > 0 && n.order !== lastSurpriseOrder; });
    if (!pool.length) pool = novels.filter(function (n) { return n.status !== 'upcoming' && n.ch > 0; });
    if (!pool.length) { showToast('Nothing to surprise you with yet ✦'); return; }

    // Weight toward novels touching genres the reader hasn't read yet
    var weighted = pool.map(function (n) {
        var newGenres = n.genres.filter(function (g) { return !touched[g]; }).length;
        return { n: n, weight: 1 + newGenres * 2 };
    });
    var total = weighted.reduce(function (a, w) { return a + w.weight; }, 0);
    var r = Math.random() * total;
    var pick = weighted[weighted.length - 1].n;
    for (var i = 0; i < weighted.length; i++) {
        r -= weighted[i].weight;
        if (r <= 0) { pick = weighted[i].n; break; }
    }
    lastSurpriseOrder = pick.order;

    var icon = document.getElementById('surpriseIcon');
    if (icon) { icon.classList.remove('dice-spin'); void icon.offsetWidth; icon.classList.add('dice-spin'); }

    showToast('🎲 How about "' + pick.title + '"?');
    openSpotlight(pick.order);
}

/* ============================================================
   LEADERBOARD
   ============================================================ */
function renderLeaderboard(mode) {
    mode = mode || 'views';
    var sorted = novels.filter(function (n) { return n.status !== 'upcoming'; }).slice();
    if (mode === 'views') sorted.sort(function (a, b) { return b.views - a.views; });
    else if (mode === 'rating') sorted.sort(function (a, b) { return b.rating - a.rating; });
    else if (mode === 'chapters') sorted.sort(function (a, b) { return b.ch - a.ch; });
    else if (mode === 'newest') sorted.sort(function (a, b) { return a.releaseOffsetDays - b.releaseOffsetDays; });
    sorted = sorted.slice(0, 10);
    var trends = ['up', 'up', 'flat', 'down', 'up', 'flat', 'down'];
    document.getElementById('lbList').innerHTML = sorted.map(function (n, i) {
        var trend = trends[i % trends.length];
        var arrow = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—';
        var val = mode === 'views' ? fmtNum(n.views) : mode === 'rating' ? ('⭐' + n.rating) : mode === 'chapters' ? (n.ch + ' ch') : releaseDate(n).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return '<div class="lb-row" onclick="openSpotlight(' + n.order + ')"><span class="lb-rank' + (i < 3 ? ' top' : '') + '">' + (i + 1) + '</span>' +
            '<div class="lb-cover">' + coverHtml(n, '').replace('<div class=""', '<div style="width:100%;height:100%"') + '</div>' +
            '<div class="lb-info"><div class="lb-title">' + esc(n.title) + '</div><div class="lb-sub">' + val + '</div></div>' +
            '<span class="lb-trend ' + trend + '">' + arrow + '</span></div>';
    }).join('');
}

/* ============================================================
   HEATMAP
   ============================================================ */
function renderHeatmap() {
    var grid = document.getElementById('heatmapGrid');
    var days = 119, cells = [];
    var today = new Date();
    for (var i = days - 1; i >= 0; i--) {
        var d = new Date(today); d.setDate(d.getDate() - i);
        var key = d.toISOString().slice(0, 10);
        var count = readingLog[key] || 0;
        var alpha = count === 0 ? 0 : count === 1 ? .3 : count <= 3 ? .6 : 1;
        cells.push('<div class="hm-cell" style="background:' + (count === 0 ? 'var(--panel-2)' : 'rgba(var(--accent-rgb),' + alpha + ')') + '" title="' + key + ': ' + count + ' chapters read"></div>');
    }
    grid.innerHTML = cells.join('');
}

/* ============================================================
   CALENDAR
   ============================================================ */
var upcomingReleases = [
    { daysOut: 45, title: 'Petal Vol. 4 —  University → Adulthood Arc ( last volume )' },
    { daysOut: 14, title: 'Case File: You — Chapter 11' },
    { daysOut: 10, title: 'Before I Forget Your Name — Chapter 2' },
    { daysOut: 20, title: 'Manga Version — The rain pact' },
    { daysOut: 99, title: 'ND' },
];
var calSorted = [];
function calRemind(idx) {
    var r = calSorted[idx];
    if (!r) return;
    showToast('Reminder noted for "' + r.title + '" ✦');
}
function renderCalendar() {
    var list = document.getElementById('calendarList');
    calSorted = upcomingReleases.slice().sort(function (a, b) { return a.daysOut - b.daysOut; });
    list.innerHTML = calSorted.map(function (r, idx) {
        var d = new Date(Date.now() + r.daysOut * 86400000);
        return '<div class="cal-item"><div class="cal-date-block"><div class="cal-day">' + d.getDate() + '</div><div class="cal-mon">' + d.toLocaleDateString('en-US', { month: 'short' }) + '</div></div>' +
            '<div class="cal-info"><div class="cal-title">' + esc(r.title) + '</div><div class="cal-count">in ' + r.daysOut + ' day' + (r.daysOut === 1 ? '' : 's') + '</div></div>' +
            '<button class="pill-btn" onclick="calRemind(' + idx + ')">Remind me</button></div>';
    }).join('');
}

/* ============================================================
   ACTIVITY FEED (sample / illustrative — wire to real analytics as needed)
   ============================================================ */
var activityTemplates = [
    { icon: '📖', text: 'Someone just started reading <b>The Rain Pact</b>' },
    { icon: '✨', text: 'A new chapter of <b>Petal Vol. 3</b> was released' },
    { icon: '🏆', text: 'A reader unlocked the <b>Bookworm</b> achievement' },
    { icon: '💬', text: 'New comment on <b>The Day She Stayed</b>' },
    { icon: '🔥', text: '<b>Before I Forget Your Name</b> is trending today' },
    { icon: '🔖', text: 'Someone bookmarked <b>Case File: You</b>' },
    { icon: '❤️', text: '<b>Ten Percent of Forever</b> just passed 7.6k views' },
    { icon: '📚', text: 'A reader finished <b>Him and Her</b> start to finish' }
];
var activityFeedItems = [];
function pushActivity() {
    var t = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
    activityFeedItems.unshift({ icon: t.icon, text: t.text, ts: Date.now() });
    activityFeedItems = activityFeedItems.slice(0, 10);
    renderActivity();
}
function renderActivity() {
    document.getElementById('activityList').innerHTML = activityFeedItems.map(function (a, i) {
        return '<div class="activity-item" style="animation-delay:' + (i * 0.02) + 's"><div class="act-icon">' + a.icon + '</div>' +
            '<div class="act-text">' + a.text + '</div><div class="act-time">' + timeAgo(a.ts) + '</div></div>';
    }).join('');
}

/* ============================================================
   COMMAND-K SEARCH
   ============================================================ */
var recentSearches = store.get('recentSearches', []);
var popularSearches = ['romance', 'ongoing stories', 'highest rated', 'case file: you', 'petal vol. 3'];
var cmdkActiveIdx = -1;
function openCmdk() {
    document.getElementById('cmdkOverlay').classList.add('open');
    document.getElementById('cmdkPanel').classList.add('open');
    document.getElementById('cmdkInput').value = '';
    cmdkRender();
    setTimeout(function () { document.getElementById('cmdkInput').focus(); }, 50);
}
function closeCmdk() {
    document.getElementById('cmdkOverlay').classList.remove('open');
    document.getElementById('cmdkPanel').classList.remove('open');
}
function cmdkRender() {
    var q = sanitize(document.getElementById('cmdkInput').value).toLowerCase();
    var results = document.getElementById('cmdkResults');
    cmdkActiveIdx = -1;
    if (!q) {
        var recentHtml = recentSearches.length ? '<div class="cmdk-section-label">Recent</div>' + recentSearches.map(function (r, i) {
            return '<div class="cmdk-row" onclick="cmdkSearchIdx(\'recent\',' + i + ')"><div class="cmdk-row-icon">🕐</div><div class="cmdk-row-title">' + esc(r) + '</div></div>';
        }).join('') : '';
        var popularHtml = '<div class="cmdk-section-label">Popular</div>' + popularSearches.map(function (r, i) {
            return '<div class="cmdk-row" onclick="cmdkSearchIdx(\'popular\',' + i + ')"><div class="cmdk-row-icon">🔥</div><div class="cmdk-row-title">' + esc(r) + '</div></div>';
        }).join('');
        results.innerHTML = recentHtml + popularHtml;
        return;
    }
    var matches = novels.filter(function (n) { return n.title.toLowerCase().indexOf(q) > -1 || n.genres.join(' ').indexOf(q) > -1; });
    if (!matches.length) { results.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);font-size:12.5px">No stories match "' + esc(q) + '"</div>'; return; }
    results.innerHTML = '<div class="cmdk-section-label">Stories</div>' + matches.map(function (n, i) {
        return '<div class="cmdk-row" data-i="' + i + '" onclick="cmdkOpen(' + n.order + ')"><div class="cmdk-row-icon"><img src="' + esc(n.img) + '" onerror="imgFail(this)"></div>' +
            '<div><div class="cmdk-row-title">' + esc(n.title) + '</div><div class="cmdk-row-sub">' + n.genres.map(function (g) { return badgeLabel[g]; }).join(' · ') + '</div></div></div>';
    }).join('');
}
function cmdkSearchTerm(term) { document.getElementById('cmdkInput').value = term; cmdkRender(); }
function cmdkSearchIdx(listName, idx) {
    var list = listName === 'recent' ? recentSearches : popularSearches;
    var term = list[idx];
    if (term != null) cmdkSearchTerm(term);
}
function cmdkOpen(order) {
    var q = document.getElementById('cmdkInput').value.trim();
    if (q) { recentSearches = [q].concat(recentSearches.filter(function (r) { return r !== q; })).slice(0, 5); store.set('recentSearches', recentSearches); }
    closeCmdk();
    openSpotlight(order);
}
document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmdk(); return; }
    if (e.key === 'Escape') { closeCmdk(); closeSettings(); closeSpotlight(); return; }
    if (document.getElementById('cmdkPanel').classList.contains('open')) {
        var rows = document.querySelectorAll('.cmdk-row');
        if (!rows.length) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); cmdkActiveIdx = Math.min(cmdkActiveIdx + 1, rows.length - 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); cmdkActiveIdx = Math.max(cmdkActiveIdx - 1, 0); }
        else if (e.key === 'Enter') { if (cmdkActiveIdx > -1) rows[cmdkActiveIdx].click(); return; }
        else return;
        rows.forEach(function (r, i) { r.classList.toggle('active', i === cmdkActiveIdx); });
        rows[cmdkActiveIdx].scrollIntoView({ block: 'nearest' });
    }
});

/* ============================================================
   SETTINGS
   ============================================================ */
function openSettings() { document.getElementById('settingsOverlay').classList.add('open'); document.getElementById('settingsPanel').classList.add('open'); }
function closeSettings() { document.getElementById('settingsOverlay').classList.remove('open'); document.getElementById('settingsPanel').classList.remove('open'); }
function toggleLight() {
    document.body.classList.toggle('light');
    var on = document.body.classList.contains('light');
    store.set('lightMode', on ? 'on' : 'off');
    var t = document.getElementById('lightToggle'); if (t) { t.classList.toggle('on', on); t.setAttribute('aria-checked', String(on)); }
}
function toggleGrain() {
    var btn = document.getElementById('grainToggle'); btn.classList.toggle('on');
    var on = btn.classList.contains('on');
    document.getElementById('grain').style.opacity = on ? '.22' : '0';
    btn.setAttribute('aria-checked', String(on));
}
function toggleMotionPref() {
    var btn = document.getElementById('motionToggle'); btn.classList.toggle('on');
    motionEnabled = btn.classList.contains('on'); store.set('motionEnabled', motionEnabled);
    btn.setAttribute('aria-checked', String(motionEnabled));
    startHeroRotate();
}
function toggleTilt() {
    var btn = document.getElementById('tiltToggle'); btn.classList.toggle('on');
    tiltEnabled = btn.classList.contains('on'); store.set('tiltEnabled', tiltEnabled);
    btn.setAttribute('aria-checked', String(tiltEnabled));
}
function subscribeNewsletter() {
    var v = document.getElementById('newsletterEmail').value.trim();
    if (!v || v.indexOf('@') < 0) { showToast('Enter a valid email first'); return; }
    document.getElementById('newsletterEmail').value = '';
    showToast('Thanks for subscribing ✦ (demo only)');
}

/* ============================================================
   COMMENTS
   ============================================================ */
var selectedStar = 0;
function setStar(n) {
    selectedStar = n;
    document.querySelectorAll('.star-btn').forEach(function (b, i) { b.classList.toggle('lit', i < n); });
}
function updateCharCount() {
    var l = document.getElementById('commentText').value.length;
    document.getElementById('charCount').textContent = l + ' / 500';
}
function populateCommentSelect() {
    var sel = document.getElementById('commentNovel');
    if (sel.dataset.filled) return;
    sel.innerHTML = '<option value="">About which novel?</option>' + novels.map(function (n) { return '<option>' + esc(n.title) + '</option>'; }).join('') + '<option>General / All novels</option>';
    sel.dataset.filled = '1';
}
var comments = store.get('novelComments', []).map(function (c) {
    return {
        name: sanitize(String(c.name || '')).slice(0, 30), novel: sanitize(String(c.novel || '')).slice(0, 60),
        text: sanitize(String(c.text || '')).slice(0, 500), ts: Number(c.ts) || Date.now(), likes: Math.max(0, parseInt(c.likes) || 0),
        liked: !!c.liked, stars: Math.min(5, Math.max(0, parseInt(c.stars) || 0))
    };
});
var avatarColors = ['#ff7d9c', '#a78bfa', '#68d8c4', '#ffc46b', '#7fa8d6', '#ff7272'];
function getInitials(n) { return n.trim().split(/\s+/).map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2); }
function getAvColor(n) { var i = 0; for (var c = 0; c < n.length; c++) i += n.charCodeAt(c); return avatarColors[i % avatarColors.length]; }
function starsHtml(n) { var s = ''; for (var i = 1; i <= 5; i++) s += '<span style="color:' + (i <= n ? 'var(--gold)' : 'var(--panel-border-strong)') + '">★</span>'; return s; }
function renderComments() {
    var list = document.getElementById('commentsList');
    document.getElementById('commentCount').textContent = comments.length + ' note' + (comments.length !== 1 ? 's' : '') + ' left in the margins';
    if (!comments.length) { list.innerHTML = '<div class="glass" style="padding:40px;text-align:center;font-family:var(--font-display);font-style:italic;color:var(--muted)">The margin is empty — be the first to write in it…</div>'; return; }
    list.innerHTML = comments.slice().reverse().map(function (c, i) {
        var ri = comments.length - 1 - i;
        return '<div class="comment-card glass" id="cc-' + ri + '">' +
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
            '<div class="c-avatar" style="background:' + getAvColor(c.name) + '">' + esc(getInitials(c.name)) + '</div>' +
            '<div style="flex:1"><div style="font-size:13px;font-weight:600">' + esc(c.name) + '</div>' +
            '<div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);display:flex;gap:8px">' + timeAgo(c.ts) + (c.stars ? ('<span>' + starsHtml(c.stars) + '</span>') : '') + '</div></div>' +
            (c.novel ? '<span class="nc-tag" style="color:var(--ink);border-color:var(--panel-border-strong)">' + esc(c.novel.length > 18 ? c.novel.slice(0, 18) + '…' : c.novel) + '</span>' : '') +
            '</div><div style="font-size:13.5px;line-height:1.7;color:var(--ink-soft)">' + esc(c.text) + '</div>' +
            '<div style="display:flex;gap:8px;margin-top:10px">' +
            '<button class="pill-btn" onclick="toggleLikeComment(' + ri + ')">' + (c.liked ? '♥' : '♡') + ' ' + (c.likes || 0) + '</button>' +
            '<button class="pill-btn" style="margin-left:auto" onclick="deleteComment(' + ri + ')">🗑 Delete</button></div></div>';
    }).join('');
}
function toggleLikeComment(i) {
    if (!comments[i]) return;
    comments[i].liked = !comments[i].liked; comments[i].likes = Math.max(0, (comments[i].likes || 0) + (comments[i].liked ? 1 : -1));
    store.set('novelComments', comments); renderComments();
}
function deleteComment(i) { comments.splice(i, 1); store.set('novelComments', comments); renderComments(); showToast('Comment deleted.'); }
var lastCommentTime = 0, COOLDOWN = 15000;
function submitComment() {
    var now = Date.now();
    var name = sanitize(document.getElementById('commentName').value);
    var novel = sanitize(document.getElementById('commentNovel').value);
    var text = sanitize(document.getElementById('commentText').value);
    if (!name || !isValidName(name)) { shakeEl('commentName'); showToast('Please enter a valid name.'); return; }
    if (text.length < 3) { shakeEl('commentText'); showToast('Comment is too short.'); return; }
    if (now - lastCommentTime < COOLDOWN) { showToast('Wait ' + Math.ceil((COOLDOWN - (now - lastCommentTime)) / 1000) + 's before posting again.'); return; }
    if ((text.match(/https?:\/\//g) || []).length > 1) { showToast('No links in comments, please.'); return; }
    lastCommentTime = now;
    comments.push({ name: name, novel: novel, text: text, ts: now, likes: 0, liked: false, stars: selectedStar });
    if (comments.length > 200) comments = comments.slice(-200);
    store.set('novelComments', comments);
    document.getElementById('commentText').value = '';
    document.getElementById('commentNovel').value = '';
    document.getElementById('commentName').value = '';
    document.getElementById('charCount').textContent = '0 / 500';
    selectedStar = 0;
    document.querySelectorAll('.star-btn').forEach(function (b) { b.classList.remove('lit'); });
    renderComments();
    showToast('Note posted! ✦');
}

/* ============================================================
   SCROLL / MISC
   ============================================================ */
window.addEventListener('scroll', function () {
    document.getElementById('scrollBtn').classList.toggle('vis', window.scrollY > 320);
}, { passive: true });

/* ============================================================
   INIT
   ============================================================ */
window.addEventListener('load', function () {
    if (store.get('lightMode', '') === 'on') { document.body.classList.add('light'); var t = document.getElementById('lightToggle'); t.classList.add('on'); t.setAttribute('aria-checked', 'true'); }
    document.getElementById('tiltToggle').classList.toggle('on', tiltEnabled);
    document.getElementById('motionToggle').classList.toggle('on', motionEnabled);
    initTheme();

    paintAurora(moodColors.all);
    renderHero();
    renderStats();
    renderLeaderboard('views');
    renderHeatmap();
    renderCalendar();
    renderComments();
    populateCommentSelect();

    for (var k = 0; k < 4; k++) pushActivity();
    if (motionEnabled) { setInterval(pushActivity, 9000); }
});
/* ============================================================
   NAVIGATION DOCK
   ============================================================ */

const dockItems = document.querySelectorAll(".dock-item");

dockItems.forEach(item => {
    item.addEventListener("click", () => {

        // Remove active state
        dockItems.forEach(i => i.classList.remove("active"));

        // Activate clicked item
        item.classList.add("active");
    });
});
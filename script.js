"use strict";
/* ============================================================
   UTILITIES

   SECURITY NOTE — user-generated content (private notes, search
   queries, private notes) is protected in two independent layers:
     1. sanitize() strips HTML tags on the way IN (before it's stored).
     2. esc() HTML-entity-escapes content on the way OUT (right before
        it's placed into innerHTML for rendering).
   Keep both. If either layer is ever removed, the other still prevents
   stored/reflected XSS, so never render user-supplied fields into
   innerHTML without passing them through esc() first.
   ============================================================ */
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;"); }
function imgFail(el) { el.style.display = 'none'; }
function sanitize(s) { return String(s).replace(/<[^>]*>/g, "").replace(/[\u0000-\u001F\u007F]/g, "").trim(); }
var store = {
    get: function (k, fb) { try { var v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fb; } catch (e) { return fb; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
};
/* Every key this app writes to localStorage. Used only to let a reader
   wipe their own locally-stored data on request (see confirmClearLocalData
   below) — nothing here is ever transmitted anywhere. */
var APP_STORAGE_KEYS = [
    'readProgress', 'bookmarks', 'currentlyReading', 'readingLog', 'readingQueue', 'claimedChallenges',
    'privateReaderNotes', 'novelComments', 'recentSearches', 'lightMode', 'theme',
    'tiltEnabled', 'motionEnabled', 'readerFontScale', 'readerAchUnlocks',
    'goldenPetalCaught', 'nightOwlRead', 'oneDayRead', 'searchedOnce', 'sharedOnce',
    'themeChanged', 'lastCommentAt', 'readerLevel', 'achievementsCollapsed', 'readerProfile'
];
function confirmClearLocalData() {
    var ok = window.confirm('This permanently erases reading progress, bookmarks, your reading queue, private notes, achievements, and saved preferences in this browser. This can\'t be undone. Continue?');
    if (!ok) return;
    APP_STORAGE_KEYS.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { } });
    showToast('Local data cleared ✦ Reloading…');
    setTimeout(function () { window.location.reload(); }, 700);
}
var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var tiltEnabled = document.body.classList.contains('editorial') ? store.get('tiltEnabled', false) : false;
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
        order: 1, title: "The Rain Pact", img: "./bg/rp.jpg", link: "./chapters/rpc.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 6, rating: 4.4, views: 15200, releaseOffsetDays: 900,
        blurb: "A story about the bonds we make, the promises we keep, and the rain that falls between us.", grad: "135deg,#3a2a3f,#5c3a4a", collections: ["best-romance", "completed"]
    },
    {
        order: 2, title: "Ten Percent of Forever", img: "./bg/tpof.jpg", link: "./chapters/tpof.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 7, rating: 4.7, views: 10000, releaseOffsetDays: 830,
        blurb: "If you only had ten percent of your time left to spend with the person you loved, how would you spend it?", grad: "135deg,#402a4a,#6a3a55", collections: ["best-romance", "completed", "editors-choice"]
    },
    {
        order: 3, title: "The Petal That Falls With a Smile Vol. 1", img: "./bg/tptfwas.jpg", link: "./chapters/tptfwas.html", genres: ["drama", "slice"], status: "completed", ch: 4, rating: 4.9, views: 24400, releaseOffsetDays: 770,
        blurb: "Life is a series of small smiles and falling petals. A gentle exploration of growing up and letting go.", grad: "135deg,#2f4a42,#3a6a55", collections: ["completed", "editors-choice"]
    },
    {
        order: 4, title: "The Day She Stayed", img: "./bg/tdss.jpg", link: "./chapters/tdss.html", genres: ["romance", "drama", "sad"], status: "completed", ch: 11, rating: 4.6, views: 11100, releaseOffsetDays: 700,
        blurb: "She was only supposed to stay for the day. But some days last a lifetime in our memories.", grad: "135deg,#2a3a4a,#3a5468", collections: ["completed", "editors-choice"]
    },
    {
        order: 5, title: "Him and Her", img: "./bg/hah.jpg", link: "./chapters/hah.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 5, rating: 4.5, views: 8300, releaseOffsetDays: 640,
        blurb: "A simple story about him, her, and the quiet spaces between their words.", grad: "135deg,#4a3a2a,#6a5230", collections: ["best-romance", "completed"]
    },
    {
        order: 6, title: "Case File: You", img: "./bg/cfy.jpg", link: "./chapters/cfy.html", genres: ["mystery", "drama", "action"], status: "completed", ch: 15, rating: 4.9, views: 26000, releaseOffsetDays: 570,
        blurb: "A mystery that begins with a single file. Who are you, really, when the world isn't looking?", grad: "135deg,#3a2a4a,#5a2a30", collections: ["editors-choice"]
    },
    {
        order: 7, title: "The Other Side of Rain", img: "./bg/tosor.jpg", link: "./chapters/tosor.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 5, rating: 4.7, views: 9100, releaseOffsetDays: 520, updatedDaysAgo: 1,
        blurb: "The rain didn't stop when the story ended. A companion piece to the emotional journey of The Rain Pact.", grad: "135deg,#2a3a4a,#3a5468", collections: ["best-romance", "completed"]
    },
    {
        order: 8, title: "The Petal That Falls With a Smile Vol. 2", img: "./bg/tptfwasv2.jpg", link: "./chapters/tptfwasv2.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 5, rating: 4.8, views: 20200, releaseOffsetDays: 460,
        blurb: "Spring returns, and with it, new stories of love and loss in the second volume of the Petal series.", grad: "135deg,#4a2a3a,#6a3a4e", collections: ["completed"]
    },
    {
        order: 9, title: "The Girl Who Was Deleted", img: "./bg/os.jpg", link: "./chapters/os.html", genres: ["mystery", "drama", "slice"], status: "completed", ch: 1, rating: 4.3, views: 4100, releaseOffsetDays: 400,
        blurb: "What happens to the digital ghosts we leave behind? A mystery wrapped in a slice-of-life shell.", grad: "135deg,#2a3a4a,#3a5468", collections: ["hidden-gems", "completed"]
    },
    {
        order: 10, title: "Him and Her Vol. 2", img: "./bg/hahv2.jpg", link: "./chapters/hahv2.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 4, rating: 4.5, views: 7800, releaseOffsetDays: 340,
        blurb: "Continuing the journey of Him and Her into a new chapter of their lives.", grad: "135deg,#4a3a2a,#6a5230", collections: ["completed"]
    },
    {
        order: 11, title: "The Petal That Falls With a Smile Vol. 3 ", img: "./bg/tptfwasv3.jpg", link: "./chapters/tptfwasv3.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 9, rating: 4.7, views: 19700, releaseOffsetDays: 270, updatedDaysAgo: 0.2,
        blurb: "The petals continue to fall as we enter the third volume of this heartwarming saga.", grad: "135deg,#4a2a3a,#6a3a4e", collections: ["best-romance", "newest"]
    },
    {
        order: 12, title: "Second Place Forever", img: "./bg/os2.jpg", link: "./chapters/os2.html", genres: ["sad", "drama", "slice"], status: "completed", ch: 1, rating: 4.6, views: 3000, releaseOffsetDays: 220,
        blurb: "Coming in second isn't always losing. A poignant one-shot about the beauty of being enough.", grad: "135deg,#2a3a4a,#3a5468", collections: ["hidden-gems", "completed"]
    },
    {
        order: 13, title: "The Hours I Sold", img: "./bg/this.jpg", link: "./chapters/this.html", genres: ["drama", "slice"], status: "completed", ch: 1, rating: 4.5, views: 2500, releaseOffsetDays: 170,
        blurb: "If time was a currency, how much would you pay for a single hour of the past?", grad: "135deg,#3a2a2a,#5a3a30", collections: ["hidden-gems", "completed"]
    },
    {
        order: 14, title: "Him and Her vol.3", img: "./bg2/hahv3.jpg", link: "./chapters2/hahv3.html", genres: ["romance", "drama", "slice", "sad"], status: "ongoing", ch: 3, rating: 4.1, views: 9000, releaseOffsetDays: 46, updatedDaysAgo: 0.08,
        blurb: "Continuing the journey of Him and Her into a new chapter of their lives.", grad: "135deg,#4a2a3a,#6a3a4e", collections: ["newest"]
    },
    {
        order: 15, title: "The Petal That Falls With a Smile — Manga Version", img: "./bg/tptfwas-manga.jpg", link: "manga.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 1, rating: 4.5, views: 5100, releaseOffsetDays: 0,
        blurb: "A manga adaptation of the beloved novel, illustrated with the same tenderness that made the original a favorite.", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["newest"]
    },
    {
        order: 16, title: "The Day She Stayed:Prequel-ONESHOT", img: "./bg2/tdssp.jpg", link: "./chapters2/ptdss.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 1, rating: 4.1, views: 9000, releaseOffsetDays: -15,
        blurb: "A PREQUEL ONESHOT OF THE DAY SHE STAYED.", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["newest"]
    },
    {
        order: 17, title: "The Bell That Rang for the Dead", img: "./bg2/osn.jpg", link: "./chapters/osn.html", genres: ["drama", "slice"], status: "completed", ch: 1, rating: 4.0, views: 3100, releaseOffsetDays: 0,
        blurb: "ONE SHOT.", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["hidden-gems"]
    },
    {
        order: 18, title: "The Other Day", img: "./bg2/tod.jpg", link: "./chapters2/tod.html", genres: ["drama", "slice"], status: "ongoing", ch: 6, rating: 4.4, views: 11000, releaseOffsetDays: 0,
        blurb: "normal days?", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["newest"]
    },
    {
        order: 19, title: "The Seat Beside Me", img: "./bg2/tsbm.jpg", link: "./chapters2/tsbm.html", genres: ["drama", "sad"], status: "completed", ch: 1, rating: 4.0, views: 6000, releaseOffsetDays: 0,
        blurb: "ONE SHOT", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["hidden-gems"]
    },
    {
        order: 20, title: "Prequel of The Petal That Falls With A Smile", img: "./bg2/p1.jpg", link: "./chapters2/p.html", genres: ["drama", "sad"], status: "Completed", ch: 5, rating: 4.9, views: 16000, releaseOffsetDays: 0,
        blurb: "Sora and Ren story!", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["newest"]
    },
    {
        order: 21, title: "The Petal That Falls With A Smile vol 4", img: "#", link: "#", genres: ["drama", "slice of life"], status: "upcoming", ch: 0, rating: null, views: null, releaseOffsetDays: 0,
        blurb: "Volume 4 — University → Adulthood Arc", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["upcoming"]
    }
];
var badgeLabel = { romance: "Romance", drama: "Drama", slice: "Slice", sad: "Sad", mystery: "Mystery", action: "Action" };
function isOneShot(n) { return n.ch === 1 && n.status === 'completed'; }
var oneShotTotal = novels.filter(isOneShot).length;
function nowMs() { return Date.now(); }
function releaseDate(n) { return new Date(nowMs() - n.releaseOffsetDays * 86400000); }
function lastUpdate(n) { return new Date(nowMs() - (n.updatedDaysAgo != null ? n.updatedDaysAgo : n.releaseOffsetDays) * 86400000); }
function likes(n) { return Math.round(n.views * 0.11); }
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
var readingQueue = store.get('readingQueue', {});
if (!readingQueue || typeof readingQueue !== 'object' || Array.isArray(readingQueue)) readingQueue = {};
var claimedChallenges = store.get('claimedChallenges', {});
var privateReaderNotes = store.get('privateReaderNotes', {});
var readerProfile = store.get('readerProfile', {});
if (!readerProfile || typeof readerProfile !== 'object' || Array.isArray(readerProfile)) readerProfile = {};

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
    if (delta > 0) {
        logReadingActivity(delta);
        var hr = new Date().getHours();
        if (hr >= 23 || hr < 5) markFlag('nightOwlRead');
    }
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
    teal: ['#68d8c4', '#a78bfa'],
    emerald: ['#3ddc97', '#a78bfa'],
    cyan: ['#22d3ee', '#818cf8'],
};
var caseClosedMoodPalette = ['#f2bd64', '#8aa3c8'];
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
    moodColors.all = document.body.classList.contains('case-closed-event') ? caseClosedMoodPalette : themeAccents[theme];
    var activeMoodCard = document.querySelector('.mood-card.active');
    var moodKey = activeMoodCard ? activeMoodCard.dataset.mood : 'all';
    if (moodKey === 'all') paintAurora(themeAccents[theme]);
    showToast('Theme set to ' + theme.charAt(0).toUpperCase() + theme.slice(1) + ' ✦');
    if (markFlag('themeChanged')) setTimeout(renderReaderAchievements, 3000);
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

function isCaseClosedOccasionActive(now) {
    now = now || new Date();
    var starts = new Date(2026, 9, 3, 0, 0, 0);
    var ends = new Date(2026, 9, 17, 0, 0, 0);
    return now >= starts && now < ends;
}
function syncCaseClosedOccasion() {
    var banner = document.getElementById('caseClosedBanner');
    if (!banner) return;
    var now = new Date();
    var ends = new Date(2026, 9, 17, 0, 0, 0);
    var active = isCaseClosedOccasionActive(now);
    var wasActive = document.body.classList.contains('case-closed-event');
    document.body.classList.toggle('case-closed-event', active);
    banner.hidden = !active;
    if (active) {
        var remaining = Math.max(1, Math.ceil((ends.getTime() - now.getTime()) / 86400000));
        var remainingLabel = document.getElementById('caseClosedRemaining');
        if (remainingLabel) remainingLabel.textContent = remaining === 1 ? 'last day' : remaining + ' days left';
        moodColors.all = caseClosedMoodPalette;
        window.setTimeout(syncCaseClosedOccasion, ends.getTime() - now.getTime() + 100);
    } else if (wasActive) {
        renderReaderAchievements();
        renderProgressJourney();
    }
}

/* ============================================================
   3D TILT
   ============================================================ */
function attachTilt(el) {
    if (!tiltEnabled || window.matchMedia('(hover: none)').matches) return;

    var raf = 0, px = 0, py = 0;

    function paintTilt() {
        raf = 0;
        if (!tiltEnabled) return;
        el.style.transform =
            'perspective(700px) rotateY(' + (px * 8) + 'deg) rotateX(' + (-py * 8) + 'deg) translateY(-4px)';
    }

    el.addEventListener('mousemove', function (e) {
        if (!tiltEnabled) return;

        var r = el.getBoundingClientRect();
        px = (e.clientX - r.left) / r.width - 0.5;
        py = (e.clientY - r.top) / r.height - 0.5;

        if (!raf) raf = requestAnimationFrame(paintTilt);
    }, { passive: true });

    el.addEventListener('mouseleave', function () {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        el.style.transform = '';
    });
}
var catalogHoverGrid = document.getElementById("catalogGrid");
var supportsCardHover = window.matchMedia("(hover: hover)").matches;
if (catalogHoverGrid && supportsCardHover) {
    catalogHoverGrid.addEventListener("mouseover", function (e) {
        var card = e.target.closest(".novel-card");
        var previousCard = e.relatedTarget && e.relatedTarget.closest
            ? e.relatedTarget.closest(".novel-card") : null;
        if (!card || card === previousCard) return;

        var cards = Array.from(catalogHoverGrid.querySelectorAll(".novel-card"));
        var i = cards.indexOf(card);
        cards.forEach(function (item) {
            item.classList.remove("active-book", "neighbor-left", "neighbor-right", "far-left", "far-right");
        });
        card.classList.add("active-book");
        if (cards[i - 1]) cards[i - 1].classList.add("neighbor-left");
        if (cards[i + 1]) cards[i + 1].classList.add("neighbor-right");
        if (cards[i - 2]) cards[i - 2].classList.add("far-left");
        if (cards[i + 2]) cards[i + 2].classList.add("far-right");
    });

    catalogHoverGrid.addEventListener("mouseout", function (e) {
        var card = e.target.closest(".novel-card");
        var nextCard = e.relatedTarget && e.relatedTarget.closest
            ? e.relatedTarget.closest(".novel-card") : null;
        if (!card || card === nextCard) return;
        catalogHoverGrid.querySelectorAll(".novel-card").forEach(function (item) {
            item.classList.remove("active-book", "neighbor-left", "neighbor-right", "far-left", "far-right");
        });
    });
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
    heroRotateTimer = null;
    if (motionEnabled && !document.hidden && heroFeaturedList.length > 1) {
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
    renderPersonalShelf();
    renderReadingQueue();
    renderProgressJourney();
    renderChallenges();
    renderCatalog();
    renderReaderAchievements();
    renderHeatmap();
    renderReaderStreak();
}
function updateQueueButton(order) {
    var button = document.getElementById('spQueueBtn');
    if (!button) return;
    var saved = !!readingQueue[order];
    button.textContent = saved ? '✓ Saved in reading queue' : '＋ Add to reading queue';
    button.classList.toggle('active', saved);
    button.setAttribute('aria-pressed', String(saved));
}
function toggleReadingQueue(order) {
    order = order || spotlightOrder;
    var novel = novels.find(function (n) { return n.order === Number(order); });
    if (!novel) return;
    if (readingQueue[novel.order]) {
        delete readingQueue[novel.order];
        showToast(novel.title + ' removed from your queue.');
    } else {
        readingQueue[novel.order] = Date.now();
        showToast(novel.title + ' saved to your reading queue ✦');
    }
    store.set('readingQueue', readingQueue);
    updateQueueButton(novel.order);
    renderReadingQueue();
}
function renderReadingQueue() {
    var list = document.getElementById('readingQueueList');
    if (!list) return;
    var queued = novels.filter(function (n) { return !!readingQueue[n.order]; })
        .sort(function (a, b) { return Number(readingQueue[a.order]) - Number(readingQueue[b.order]); });
    var count = document.getElementById('readingQueueCount');
    if (count) count.textContent = queued.length + ' saved';
    if (!queued.length) {
        list.innerHTML = '<div class="queue-empty glass"><span aria-hidden="true">↗</span><strong>Your next read, saved</strong><p>Open any story and add it to your queue for later.</p><button type="button" class="pill-btn" onclick="scrollToId(\'catalog\')">Browse the shelf →</button></div>';
        return;
    }
    list.innerHTML = queued.map(function (n) {
        var read = getRead(n), pct = n.ch ? Math.round(read / n.ch * 100) : 0;
        var meta = n.status === 'upcoming' ? 'Coming soon' : (n.ch - read) + ' chapters left';
        return '<article class="queue-card glass"><button class="queue-story" type="button" onclick="openSpotlight(' + n.order + ')"><span class="queue-cover" style="background:linear-gradient(' + n.grad + ')"><img src="' + esc(n.img) + '" alt="" loading="lazy" onerror="imgFail(this)"></span><span class="queue-story-copy"><strong>' + esc(n.title) + '</strong><span>' + meta + '</span>' + (n.ch ? '<span class="queue-progress"><i style="width:' + pct + '%"></i></span>' : '') + '</span><span class="queue-open-mark" aria-hidden="true">→</span></button><button type="button" class="queue-remove" onclick="toggleReadingQueue(' + n.order + ')" aria-label="Remove ' + esc(n.title) + ' from reading queue">×</button></article>';
    }).join('');
}
function personalMiniCard(n, label, actionText) {
    if (!n) return '<div class="personal-empty"><span class="personal-empty-icon">✦</span><strong>Nothing here yet</strong><span>Choose a story from the Shelf to start building this space.</span></div>';
    var read = getRead(n), pct = n.ch ? Math.round(read / n.ch * 100) : 0;
    return '<div class="personal-card-label">' + label + '</div><div class="personal-story-row"><div class="personal-cover" style="background:linear-gradient(' + n.grad + ')"><img src="' + esc(n.img) + '" alt="" onerror="imgFail(this)"></div><div class="personal-story-info"><h3>' + esc(n.title) + '</h3><div class="personal-story-meta">' + (n.status === 'upcoming' ? 'Coming soon' : read + ' / ' + n.ch + ' chapters') + '</div>' + (n.ch ? '<div class="personal-progress"><span style="width:' + pct + '%"></span></div>' : '') + '</div></div><button class="pill-btn personal-card-action" onclick="openReaderMode(' + n.order + ')">' + actionText + ' →</button>';
}
function renderPersonalShelf() {
    var current = currentlyReadingOrder && novels.find(function (n) { return n.order === currentlyReadingOrder; });
    var favorites = novels.filter(function (n) { return bookmarks[n.order] && n.status !== 'upcoming'; }).sort(function (a, b) { return b.order - a.order; })[0];
    var finished = novels.filter(function (n) { return n.ch > 0 && getRead(n) >= n.ch; }).sort(function (a, b) { return b.order - a.order; })[0];
    var currentEl = document.getElementById('personalCurrentCard');
    var favoriteEl = document.getElementById('personalFavoritesCard');
    var finishedEl = document.getElementById('personalFinishedCard');
    if (!currentEl || !favoriteEl || !finishedEl) return;
    currentEl.innerHTML = personalMiniCard(current, 'Currently reading', current ? 'Continue' : 'Choose a story');
    favoriteEl.innerHTML = personalMiniCard(favorites, 'A favorite from your shelf', favorites ? 'Open favorite' : 'Add a favorite');
    finishedEl.innerHTML = personalMiniCard(finished, 'Recently finished', finished ? 'Revisit' : 'Finish your first story');
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
            '<div class="stat-num" id="statNum' + i + '">0</div><div class="stat-label">' + esc(t.label) + '</div></div>';
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
    scheduleCatalogRender();
    scrollToId('catalog');
    showToast('Showing ' + el.querySelector('.mood-label').textContent + ' reads ✦');
}

/* ============================================================
   STORY MATCH — 3.8 DISCOVERY FEATURE
   ============================================================ */
var lastStoryMatchOrder = null;
function runStoryMatch() {
    var moodEl = document.getElementById('storyMatchMood');
    var timeEl = document.getElementById('storyMatchTime');
    var result = document.getElementById('storyMatchResult');
    if (!moodEl || !timeEl || !result) return;
    var mood = moodEl.value;
    var maxMinutes = Number(timeEl.value);
    var genres = { romance: ['romance'], sad: ['sad', 'drama'], mystery: ['mystery', 'action'], slice: ['slice'] };
    var candidates = novels.filter(function (n) {
        return n.status !== 'upcoming' && n.ch > 0 && (!genres[mood] || genres[mood].some(function (g) { return n.genres.indexOf(g) > -1; }));
    }).map(function (n) {
        var remaining = Math.max(1, n.ch - getRead(n));
        return { novel: n, minutes: Math.max(6, Math.round(remaining * 7)) };
    });
    if (!candidates.length) {
        result.textContent = 'No stories match those choices yet. Try another mood.';
        return;
    }
    var fits = maxMinutes ? candidates.filter(function (x) { return x.minutes <= maxMinutes; }) : candidates.slice();
    var pool = fits.length ? fits : candidates.slice().sort(function (a, b) { return a.minutes - b.minutes; }).slice(0, 1);
    if (pool.length > 1 && lastStoryMatchOrder !== null) {
        var fresh = pool.filter(function (x) { return x.novel.order !== lastStoryMatchOrder; });
        if (fresh.length) pool = fresh;
    }
    var pick = pool[Math.floor(Math.random() * pool.length)];
    lastStoryMatchOrder = pick.novel.order;
    var n = pick.novel;
    var fitLabel = fits.length ? 'A good fit for your time' : 'Closest match to your time';
    result.innerHTML = '<div class="story-match-cover" style="background:linear-gradient(' + n.grad + ')"><img src="' + esc(n.img) + '" alt="" onerror="imgFail(this)"></div>' +
        '<div class="story-match-copy"><span class="story-match-fit">' + fitLabel + ' · about ' + pick.minutes + ' min</span><strong>' + esc(n.title) + '</strong><span>' + esc(n.blurb) + '</span></div>' +
        '<button class="pill-btn" type="button" onclick="openSpotlight(' + n.order + ')">View story →</button>';
}

/* ============================================================
   CATALOG (THE SHELF)
   ============================================================ */
var activeGenre = 'all', activeStatus = 'all', catalogRenderTimer = null;
function scheduleCatalogRender() {
    clearTimeout(catalogRenderTimer);
    catalogRenderTimer = setTimeout(function () { catalogRenderTimer = null; renderCatalog(); }, 70);
}
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
        this.querySelectorAll('.pill-btn').forEach(function (b) {
            b.classList.toggle('active', b === btn);
            b.setAttribute('aria-pressed', String(b === btn));
        });
        btn.classList.add('active'); activeStatus = btn.dataset.status || 'all'; renderCatalog();
    });
    document.getElementById('lbTabs').addEventListener('click', function (e) {
        var btn = e.target.closest('.pill-btn'); if (!btn) return;
        this.querySelectorAll('.pill-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active'); renderLeaderboard(btn.dataset.lb);
    });
});
function clearShelfFilters() {
    activeGenre = 'all';
    activeStatus = 'all';
    activeMoodGenres = null;
    var search = document.getElementById('shelfSearch');
    if (search) search.value = '';
    document.querySelectorAll('#genrePills .pill-btn').forEach(function (p) { p.classList.toggle('active', p.dataset.genre === 'all'); });
    document.querySelectorAll('#statusPills .pill-btn').forEach(function (p) {
        var active = p.dataset.status === 'all';
        p.classList.toggle('active', active);
        p.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.mood-card').forEach(function (c) { c.classList.toggle('active', c.dataset.mood === 'all'); });
    scheduleCatalogRender();
    showToast('Shelf filters cleared ✦');
}
function renderCatalog() {
    var grid = document.getElementById('catalogGrid');
    var searchEl = document.getElementById('shelfSearch');
    var q = sanitize(searchEl ? searchEl.value : '').toLowerCase();
    var filtered = novels.filter(function (n) {
        var matchesMood = !activeMoodGenres || activeMoodGenres.some(function (g) { return n.genres.indexOf(g) > -1; });
        var matchesQ = !q || n.title.toLowerCase().indexOf(q) > -1 || n.genres.join(' ').indexOf(q) > -1;
        var matchesGenre = activeGenre === 'all' || n.genres.indexOf(activeGenre) > -1;
        var matchesStatus = activeStatus === 'all' || (activeStatus === 'unread'
            ? n.status !== 'upcoming' && getRead(n) === 0
            : n.status === activeStatus);
        return matchesMood && matchesQ && matchesGenre && matchesStatus;
    }).sort(function (a, b) { return b.order - a.order; });
    document.getElementById('shelfCount').textContent = filtered.length + ' stor' + (filtered.length === 1 ? 'y' : 'ies') + ', filed and ready to open.';
    updateShelfSearchUI(filtered.length);
    var summaryEl = document.getElementById('catalogFilterSummary');
    if (summaryEl) {
        var summary = [];
        if (q) summary.push('Search: ' + q);
        if (activeGenre !== 'all') summary.push(badgeLabel[activeGenre] || activeGenre);
        if (activeStatus !== 'all') summary.push(activeStatus === 'unread' ? 'Unread' : activeStatus);
        if (activeMoodGenres) summary.push('mood');
        summaryEl.textContent = summary.length ? summary.join(' · ') : 'Showing everything';
    }
    var clearBtn = document.getElementById('clearShelfBtn');
    if (clearBtn) clearBtn.disabled = !q && activeGenre === 'all' && activeStatus === 'all' && !activeMoodGenres;
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
            '<div class="nc-body"><div class="nc-genres">' + n.genres.slice(0, 3).map(function (g) { return '<span class="nc-tag">' + badgeLabel[g] + '</span>'; }).join('') + '</div>' +
            '<div class="nc-title">' + esc(n.title) + '</div>' +
            '<div class="nc-meta"><span>' + (n.rating ? ('⭐ ' + n.rating) : '—') + '</span><span>👁 ' + fmtNum(n.views) + '</span><span>📖 ' + (n.ch || '0') + ' ch</span></div>' +
            (n.ch ? '<div class="nc-progress"><div class="nc-progress-fill" style="width:' + pct + '%"></div></div><div class="nc-progress-label">' + read + ' / ' + n.ch + ' read</div>' : '<div class="nc-progress-label">Releasing soon</div>') +
            '</div></div></div>';
    }).join('');
    if (tiltEnabled) {
        Array.prototype.forEach.call(grid.querySelectorAll('.novel-card'), function (card) {
            attachTilt(card);
        });
    }
   
}
function toggleLikeNovel(order) {
    bookmarks[order] = !bookmarks[order];
    store.set('bookmarks', bookmarks);
    showToast(bookmarks[order] ? 'Added to your favorites ♥' : 'Removed from favorites');
    refreshReadingUI();
}
function shareNovelQuick(order) {
    var n = novels.find(function (x) { return x.order === order; });
    var url = window.location.href.split('#')[0] + (n.link || '');
    if (navigator.clipboard) { navigator.clipboard.writeText(url).catch(function () { }); }
    showToast('Link copied for "' + n.title + '" ↗');
    if (markFlag('sharedOnce')) setTimeout(renderReaderAchievements, 3000);
}

/* ============================================================
   SPOTLIGHT PANEL
   ============================================================ */
var spotlightOrder = null;
var readerModeOrder = null;
var readerModeChapter = 1;
var readerFontScale = store.get('readerFontScale', 1);
function openSpotlight(order) {
    var n = novels.find(function (x) { return x.order === order; });
    if (!n) return;
    if (order === 6 && isCaseClosedOccasionActive()) unlockCaseClosedAchievement();
    spotlightOrder = order;
    var bg = document.getElementById('spCoverBg');
    bg.style.background = 'linear-gradient(' + n.grad + ')';
    bg.innerHTML = '<img src="' + esc(n.img) + '" style="width:100%;height:100%;object-fit:cover;opacity:.85" onerror="imgFail(this)">';
    var statusCls = n.status === 'ongoing' ? 'status-ongoing' : n.status === 'upcoming' ? 'status-upcoming' : 'status-completed';
    document.getElementById('spStatusRow').innerHTML = n.genres.map(function (g) { return '<span class="nc-tag" style="color:var(--ink);border-color:var(--panel-border-strong)">' + badgeLabel[g] + '</span>'; }).join('') +
        '<span class="nc-tag ' + statusCls + '" style="border:none">' + n.status + '</span>';
    document.getElementById('spTitle').textContent = n.title;
    loadPrivateNote(n);
    document.getElementById('spByline').textContent = 'A Novel by AKA · ⭐ ' + (n.rating || '—') + ' · 👁 ' + fmtNum(n.views);
    document.getElementById('spDesc').textContent = n.blurb;
    var read = getRead(n), pct = n.ch ? Math.round(read / n.ch * 100) : 0;
    document.getElementById('spFill').style.width = pct + '%';
    document.getElementById('spChRead').textContent = read + ' / ' + n.ch + ' chapters read';
    document.getElementById('spMinus').disabled = read === 0;
    document.getElementById('spPlus').disabled = read >= n.ch;
    var chList = document.getElementById('spChapterList');
    var html = '';
    var isSingleChapter = n.ch === 1;
    for (var i = 1; i <= Math.min(n.ch, 10); i++) {
        var isRead = i <= read;
        var cName = isSingleChapter ? 'One Shot' : 'Chapter ' + i;
        html += '<a class="sp-ch-item" href="' + (n.link || '#') + '"><div class="sp-ch-num' + (isRead ? ' read' : '') + '">' + (isRead ? '✓' : i) + '</div><span style="flex:1">' + cName + '</span>' +
            (isRead ? '<span style="font-size:10px;color:var(--sage)">Read</span>' : '<span style="font-size:10px;color:var(--muted)">→</span>') + '</a>';
    }
    if (n.ch > 10) html += '<div style="text-align:center;font-family:var(--font-mono);font-size:10px;color:var(--muted);padding:6px">+ ' + (n.ch - 10) + ' more chapters</div>';
    if (n.ch === 0) html = '<div style="text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--muted);padding:10px">Chapters land here on release day.</div>';
    chList.innerHTML = html;
    var bbtn = document.getElementById('spBookmarkBtn');
    if (currentlyReadingOrder === order) { bbtn.textContent = '✓ Currently Reading'; bbtn.classList.add('active'); }
    else { bbtn.textContent = '🔖 Set as Currently Reading'; bbtn.classList.remove('active'); }
    updateQueueButton(order);
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
function goToNovel() {
    var n = novels.find(function (x) { return x.order === spotlightOrder; });
    if (n) openReaderMode(n.order);
}
function openReaderMode(order) {
    var n = novels.find(function (x) { return x.order === order; });
    if (!n) return;
    readerModeOrder = order;
    readerModeChapter = n.ch ? (getRead(n) >= n.ch ? n.ch : Math.max(1, getRead(n) + 1)) : 1;
    closeSpotlight();
    updateReaderMode();
    document.getElementById('readerModeOverlay').classList.add('open');
    document.getElementById('readerModePanel').classList.add('open');
    document.body.classList.add('reader-mode-active');
}
function updateReaderMode() {
    var n = novels.find(function (x) { return x.order === readerModeOrder; });
    if (!n) return;
    var total = n.ch || 1;
    var read = getRead(n);
    var pct = n.ch ? Math.round(read / n.ch * 100) : 0;
    document.getElementById('readerModeTitle').textContent = n.title;
    document.getElementById('readerModeByline').textContent = 'A Novel by AKA · ' + (n.status === 'ongoing' ? 'Ongoing' : 'Completed');
    document.getElementById('readerModeIntro').textContent = n.blurb;
    document.getElementById('readerModeProgressLabel').textContent = 'Chapter ' + readerModeChapter + ' of ' + total;
    document.getElementById('readerModeProgressPct').textContent = pct + '%';
    document.getElementById('readerModeProgressFill').style.width = pct + '%';
    document.getElementById('readerModeChapterText').textContent = n.ch ? ('Chapter ' + readerModeChapter) : 'Coming on release day';
    document.getElementById('readerModeBody').textContent = n.ch ? ('You are in the focus space for chapter ' + readerModeChapter + '. Mark it as read when you finish, or open the full chapter when you are ready to continue.') : 'This story is part of the upcoming shelf. Keep it bookmarked and return when the chapter lands.';
    document.getElementById('readerModeMarkBtn').textContent = n.ch && read >= readerModeChapter ? '✓ Chapter marked as read' : 'Mark chapter as read';
    document.getElementById('readerModeMarkBtn').disabled = !n.ch || read >= readerModeChapter;
    document.getElementById('readerModeOpenBtn').textContent = n.link && n.link !== '#' ? 'Open full chapter →' : 'Story link coming soon';
    document.getElementById('readerModeOpenBtn').disabled = !n.link || n.link === '#';
    var bbtn = document.getElementById('readerModeBookmarkBtn');
    bbtn.textContent = currentlyReadingOrder === n.order ? '✓ Currently Reading' : '🔖 Set as Currently Reading';
    bbtn.classList.toggle('active', currentlyReadingOrder === n.order);
    document.querySelector('.reader-mode-copy').style.fontSize = readerFontScale + 'em';
}
function closeReaderMode() {
    document.getElementById('readerModeOverlay').classList.remove('open');
    document.getElementById('readerModePanel').classList.remove('open');
    document.body.classList.remove('reader-mode-active');
    readerModeOrder = null;
}
function adjustReaderChapter(delta) {
    var n = novels.find(function (x) { return x.order === readerModeOrder; });
    if (!n || !n.ch) return;
    readerModeChapter = Math.max(1, Math.min(readerModeChapter + delta, n.ch));
    updateReaderMode();
}
function adjustReaderFont(delta) {
    readerFontScale = Math.max(.9, Math.min(1.25, +(readerFontScale + delta * .05).toFixed(2)));
    store.set('readerFontScale', readerFontScale);
    updateReaderMode();
}
function readerModeBookmark() {
    var n = novels.find(function (x) { return x.order === readerModeOrder; });
    if (!n) return;
    currentlyReadingOrder = currentlyReadingOrder === n.order ? null : n.order;
    store.set('currentlyReading', currentlyReadingOrder);
    refreshReadingUI();
    updateReaderMode();
    showToast(currentlyReadingOrder === n.order ? 'Added to Currently Reading 🔖' : 'Bookmark removed.');
}
function readerModeMarkComplete() {
    var n = novels.find(function (x) { return x.order === readerModeOrder; });
    if (!n || !n.ch) return;
    var delta = readerModeChapter - getRead(n);
    if (delta > 0) adjustProgress(n.order, delta);
    if (readerModeChapter < n.ch) readerModeChapter++;
    updateReaderMode();
}
function readerModeOpenStory() {
    var n = novels.find(function (x) { return x.order === readerModeOrder; });
    if (!n || !n.link || n.link === '#') { showToast('The full chapter link is coming soon ✦'); return; }
    window.location.href = n.link;
}
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
        { id: 'weekly', title: 'Turn 15 Pages', sub: 'Read 15 chapters this week', target: 15, cur: Math.min(weekCh, 15), xp: 150 },
        { id: 'weekly',  title: 'turn 35 pages',  sub: 'Read 35 chapters this week',target:35,cur:Math.min(weekCh,35), xp:700},
        { id: 'monthly', title: 'Finish 2 Full Story', sub: 'Complete two novel', target: 2, cur: Math.min(monthDone, 2), xp: 400 },
        { id: 'monthly', title: 'Finish 4 ONESHOT', sub: 'Complete four oneshot novel', target: 4, cur: Math.min(monthDone, 4), xp: 600},                                                                                                                 
        { id: 'variety', title: 'Genre Explorer', sub: 'Read from 3 different genres', target: 3, cur: Math.min(genresTouched(), 3), xp: 200 },
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
    var visibleAchievements = getVisibleReaderAchievementEntries();
    var unlockedCount = visibleAchievements.filter(function (entry) { return entry.achievement.metric(s) >= entry.achievement.target; }).length;
    document.getElementById('journeyStats').textContent = unlockedCount + ' / ' + visibleAchievements.length + ' badges earned';

    var lvl = computeReaderLevel(s, unlockedCount);
    var badge = document.getElementById('readerLevelBadge');
    var rankName = document.getElementById('readerRankName');
    var levelSub = document.getElementById('readerLevelSub');
    var xpFill = document.getElementById('readerXpFill');
    var xpLabel = document.getElementById('readerXpLabel');
    if (badge) badge.textContent = lvl.level;
    if (rankName) rankName.textContent = rank;
    if (levelSub) levelSub.textContent = 'Level ' + lvl.level;
    if (xpFill) xpFill.style.width = lvl.pct + '%';
    if (xpLabel) xpLabel.textContent = lvl.into + ' / ' + lvl.need + ' XP to Level ' + (lvl.level + 1);
    var prevLevel = store.get('readerLevel', null);
    store.set('readerLevel', lvl.level);
    if (prevLevel !== null && lvl.level > prevLevel) showToast('🎉 Level up! You\'re now Level ' + lvl.level + '.');
}
function weekendReadFlag() {
    var found = false;
    Object.keys(readingLog).forEach(function (k) {
        var day = new Date(k + 'T00:00:00').getDay();
        if (day === 0 || day === 6) found = true;
    });
    return found ? 1 : 0;
}
function distinctReadingDays() {
    return Object.keys(readingLog).filter(function (k) { return readingLog[k] > 0; }).length;
}
function notesWritten() {
    return Object.keys(privateReaderNotes).filter(function (key) { return String(privateReaderNotes[key] || '').trim().length > 0; }).length;
}
function favoritesCount() {
    return Object.keys(bookmarks).filter(function (k) { return bookmarks[k]; }).length;
}
function longFormCompleted() {
    return novels.some(function (n) { return n.ch >= 9 && getRead(n) >= n.ch; }) ? 1 : 0;
}
/* Turns real reading activity into an XP total and level: 15 XP per chapter
   read, 60 XP per novel finished, 5 XP per distinct reading day, 25 XP per
   achievement unlocked. Level 2 starts at 100 XP; each next level costs 50 XP
   more than the previous one. */
function computeReaderLevel(s, unlockedCount) {
    var totalXP = s.read * 15 + s.completed * 60 + s.days * 5 + unlockedCount * 25;
    var level = 1;
    var remainingXP = totalXP;
    var need = 100;
    while (remainingXP >= need) {
        remainingXP -= need;
        level++;
        need = 100 + (level - 1) * 50;
    }
    var pct = Math.min(100, Math.floor(remainingXP / need * 100));
    return { level: level, into: remainingXP, need: need, pct: pct, totalXP: totalXP };
}
function computeReaderStats() {
    return {
        read: totalRead(),
        genres: genresTouched(),
        completed: completedCount(),
        week: chaptersInLastDays(7),
        bookmarked: currentlyReadingOrder ? 1 : 0,
        weekend: weekendReadFlag(),
        days: distinctReadingDays(),
        notes: notesWritten(),
        favorites: favoritesCount(),
        oneDay: store.get('oneDayRead', 0),
        oneShots: novels.filter(function (n) { return isOneShot(n) && getRead(n) >= n.ch; }).length,
        bestStreak: computeBestStreak(),
        nightOwl: store.get('nightOwlRead', false) ? 1 : 0,
        searched: store.get('searchedOnce', false) ? 1 : 0,
        themed: store.get('themeChanged', false) ? 1 : 0,
        shared: store.get('sharedOnce', false) ? 1 : 0,
        longForm: longFormCompleted(),
        eclipseWitness: store.get('readerAchUnlocks', {}).eclipseWitness ? 1 : 0
    };
}
/* One-time flags for achievements tied to trying a feature, not just reading.
   Returns true only the first time a given flag is set (so callers know
   whether to refresh the achievements grid). */
function markFlag(key) {
    if (store.get(key, false)) return false;
    store.set(key, true);
    return true;
}
var readerAchievementDefs = [
    { icon: '📖', title: 'First Stamp', hint: 'Read your first chapter', rarity: 'common', metric: function (s) { return s.read; }, target: 1 },
    { icon: '🔖', title: 'Bookmarked', hint: 'Set a novel as Currently Reading', rarity: 'common', metric: function (s) { return s.bookmarked; }, target: 1 },
    { icon: '🌈', title: 'Shelf Hopper', hint: 'Read from 3 different genres', rarity: 'common', metric: function (s) { return s.genres; }, target: 3 },
    { icon: '🧭', title: 'Genre Compass', hint: 'Read from 4 different genres', rarity: 'rare', metric: function (s) { return s.genres; }, target: 4 },
    { icon: '🏆', title: 'Full Return', hint: 'Finish a novel start to finish', rarity: 'rare', metric: function (s) { return s.completed; }, target: 1 },
    { icon: '⚡', title: 'Marathoner', hint: 'Read 10+ chapters in a single week', rarity: 'common', metric: function (s) { return s.week; }, target: 10 },
    { icon: '🌅', title: 'Weekend Reader', hint: 'Read on a Saturday or Sunday', rarity: 'rare', metric: function (s) { return s.weekend; }, target: 1 },
    { icon: '📝', title: 'Margin Writer', hint: 'Save a private reader note', rarity: 'rare', metric: function (s) { return s.notes; }, target: 1 },
    { icon: '🎬', title: 'One-Shot Wonder', hint: 'Complete all ' + oneShotTotal + ' one-shots on the Shelf', rarity: 'rare', metric: function (s) { return s.oneShots; }, target: oneShotTotal },
    { icon: '📚', title: 'Chapter Collector', hint: 'Read 25 chapters total', rarity: 'rare', metric: function (s) { return s.read; }, target: 25 },
    { icon: '🔥', title: 'Bookworm', hint: 'Read 45+ chapters total', rarity: 'epic', metric: function (s) { return s.read; }, target: 45 },
    { icon: '🌙', title: 'Afterglow Reader', hint: 'Read on 7 different days', rarity: 'epic', metric: function (s) { return s.days; }, target: 7 },
    { icon: '🧡', title: 'Story Curator', hint: 'Favorite 3 stories', rarity: 'common', metric: function (s) { return s.favorites; }, target: 3 },
    { icon: '🗂️', title: 'Archive Diver', hint: 'Finish 3 stories start to finish', rarity: 'epic', metric: function (s) { return s.completed; }, target: 3 },
    { icon: '👑', title: 'Genre Omnivore', hint: 'Read from all 6 genres', rarity: 'legendary', metric: function (s) { return s.genres; }, target: 6 },
    { 
    icon: '💖',
    title: 'Heart Collector',
    hint: 'Favorite 10 stories',
    rarity: 'epic',
    metric: function (s) { return s.favorites; },
    target: 10
},
{
    icon: '📆',
    title: 'Daily Devotion',
    hint: 'Read on 30 different days',
    rarity: 'legendary',
    metric: function (s) { return s.days; },
    target: 30
}
];
readerAchievementDefs.push(
    { icon: '🔍', title: 'Master Searcher', hint: 'Use search to find a story', rarity: 'common', metric: function (s) { return s.searched; }, target: 1 },
    { icon: '🎨', title: 'Own Your Look', hint: 'Switch to a different color theme', rarity: 'common', metric: function (s) { return s.themed; }, target: 1 },
    { icon: '↗️', title: 'Storyteller', hint: 'Share a story with someone', rarity: 'rare', metric: function (s) { return s.shared; }, target: 1 },
    { icon: '🌌', title: 'Night Owl', hint: 'Read a chapter between 11pm and 5am', rarity: 'rare', metric: function (s) { return s.nightOwl; }, target: 1 },
    { icon: '🚀', title: 'On a Roll', hint: 'Reach a 3-day reading streak', rarity: 'rare', metric: function (s) { return s.bestStreak; }, target: 3 },
    { icon: '🐋', title: 'Deep Diver', hint: 'Finish one of the longer sagas (9+ chapters) start to finish', rarity: 'rare', metric: function (s) { return s.longForm; }, target: 1 },
    { icon: '📅', title: 'Unstoppable', hint: 'Reach a 7-day reading streak', rarity: 'epic', metric: function (s) { return s.bestStreak; }, target: 7 },
    { icon: '💖', title: 'Heart Collector', hint: 'Favorite 10 stories', rarity: 'epic', metric: function (s) { return s.favorites; }, target: 10 },
    { icon: '📆', title: 'Daily Devotion', hint: 'Read on 30 different days', rarity: 'legendary', metric: function (s) { return s.days; }, target: 30 },
    { icon: '🌘', title: 'Eclipse Witness', hint: 'Find the one book disappears when the Library goes dark [possbile of occuring is 1.5% in a day]', rarity: 'Mythic', metric: function (s) { return s.eclipseWitness; }, target: 1 },
    {
  icon: "👁",
  title: "The Watcher",
  hint: "Witness the Eye awaken [possbile of occuring is 3.5% in a day]  .",
  rarity: "Mythic",
  metric: function () {
    return store.get("readerAchUnlocks", {}).eyeWatcher ? 1 : 0;
  },
  target: 1
},
{
  icon: "🐉",
  title: "The Keeper",
  hint: "Wake the Eye, witness the Eclipse.",
  rarity: "Mythical Honor",
  metric: function () {
    var u = store.get("readerAchUnlocks", {});
    return (u.eyeWatcher ? 1 : 0) + (u.eclipseWitness ? 1 : 0) + (u.neonArchivist ? 1 : 0);
  },
  target: 2
}
);

var readerAchievementCoreCount = readerAchievementDefs.length;
readerAchievementDefs.push({
    icon: '🌟', title: 'Living Legend', hint: 'Unlock every other reader achievement', rarity: 'Immortal',
    metric: function (s) {
        var count = 0;
        for (var i = 0; i < readerAchievementCoreCount; i++) {
            if (readerAchievementDefs[i].metric(s) >= readerAchievementDefs[i].target) count++;
        }
        return count;
    },
    target: readerAchievementCoreCount
});
readerAchievementDefs.push({
    icon: '🗃️', title: 'Case Closed',
    hint: 'Visit Case File: You Vol. 1 during the limited celebration. Once earned, it stays in your collection.',
    rarity: 'limited', unlockKey: 'caseClosed', limitedEvent: true,
    metric: function () { return store.get('readerAchUnlocks', {}).caseClosed ? 1 : 0; },
    target: 1
});
function getVisibleReaderAchievementEntries() {
    var unlocks = store.get('readerAchUnlocks', {});
    return readerAchievementDefs.map(function (achievement, index) { return { achievement: achievement, index: index }; })
        .filter(function (entry) {
            return !entry.achievement.limitedEvent || isCaseClosedOccasionActive() || !!unlocks[entry.achievement.unlockKey];
        });
}
function unlockCaseClosedAchievement() {
    if (!isCaseClosedOccasionActive()) return;
    var unlocks = store.get('readerAchUnlocks', {});
    if (unlocks.caseClosed) return;
    unlocks.caseClosed = new Date().toISOString();
    store.set('readerAchUnlocks', unlocks);
    renderReaderAchievements();
    renderProgressJourney();
    showToast('🏆 Limited achievement unlocked: Case Closed!');
}
function renderReaderAchievements() {
    var s = computeReaderStats();
    // Fetched fresh on every render (not cached at page load) so that flags set
    // by unlockEyeAchievement()/unlockEclipseReward()/unlockNeonAchievement()
    // in between renders aren't clobbered when this function writes back below.
    var readerAchUnlocks = store.get('readerAchUnlocks', {});
    var grid = document.getElementById('achievementGrid');
    if (!grid) return;
    var newlyUnlocked = [];
    grid.innerHTML = getVisibleReaderAchievementEntries().map(function (entry) {
        var a = entry.achievement, idx = entry.index;
        var unlockKey = a.unlockKey || idx;
        var cur = a.metric(s);
        var pct = Math.min(100, Math.round(cur / a.target * 100));
        var unlocked = cur >= a.target;
        if (unlocked && !readerAchUnlocks[unlockKey]) { readerAchUnlocks[unlockKey] = new Date().toISOString(); store.set('readerAchUnlocks', readerAchUnlocks); newlyUnlocked.push(a.title); }
        var dateLabel = unlocked && readerAchUnlocks[unlockKey] ? new Date(readerAchUnlocks[unlockKey]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
        return '<div class="glass milestone-tile' + (unlocked ? ' unlocked' : '') + '">' +
            '<div class="m-icon-row"><div class="m-icon">' + a.icon + '</div><span class="rarity-tag rarity-' + a.rarity + '">' + a.rarity + '</span></div>' +
            '<div class="m-title">' + a.title + '</div><div class="m-hint">' + a.hint + '</div>' +
            '<div class="m-progress-row"><span>' + (unlocked ? 'Complete' : pct + '%') + '</span><span>' + fmtNum(Math.min(cur, a.target)) + ' / ' + fmtNum(a.target) + '</span></div>' +
            '<div class="m-bar"><div class="m-fill" style="width:' + pct + '%"></div></div>' +
            '<div class="m-footer">' + (unlocked ? '<span class="m-date">Unlocked ' + dateLabel + '</span>' : '<span class="m-date" style="color:var(--muted)">Locked</span>') +
            '<button class="m-share" onclick="shareReaderAch(' + idx + ')" aria-label="Share achievement">↗</button></div></div>';
    }).join('');
    if (newlyUnlocked.length === 1) {
        showToast('🏆 Achievement unlocked: ' + newlyUnlocked[0] + '!');
    } else if (newlyUnlocked.length > 1) {
        showToast('🏆 ' + newlyUnlocked.length + ' achievements unlocked!');
    }
}
function toggleAchievements() {
    var grid = document.getElementById('achievementGrid');
    var button = document.getElementById('achievementsToggle');
    if (!grid || !button) return;
    var collapsed = !grid.hidden;
    grid.hidden = collapsed;
    button.setAttribute('aria-expanded', String(!collapsed));
    button.innerHTML = collapsed
        ? 'Show achievements <span aria-hidden="true">⌄</span>'
        : 'Minimize achievements <span aria-hidden="true">⌃</span>';
    store.set('achievementsCollapsed', collapsed);
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
    document.getElementById('lbList').innerHTML = sorted.map(function (n, i) {
        var val = mode === 'views' ? fmtNum(n.views) : mode === 'rating' ? ('⭐' + n.rating) : mode === 'chapters' ? (n.ch + ' ch') : releaseDate(n).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return '<div class="lb-row" onclick="openSpotlight(' + n.order + ')"><span class="lb-rank' + (i < 3 ? ' top' : '') + '">' + (i + 1) + '</span>' +
            '<div class="lb-cover">' + coverHtml(n, '').replace('<div class=""', '<div style="width:100%;height:100%"') + '</div>' +
            '<div class="lb-info"><div class="lb-title">' + esc(n.title) + '</div><div class="lb-sub">' + val + '</div></div></div>';
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
    { date: '2026-10-12', title: "The Other Day - Chapter 7" },
    { date: '2026-10-13', title: 'Him and Her vol 3 - chapter 3' },
    { date: '2026-10-25', title: 'Petal Vol. 4 —  University → Adulthood Arc ' },
];
var calSorted = [];

function daysUntil(dateStr) {
    var target = new Date(dateStr + 'T00:00:00');
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
}

function calRemind(idx) {
    var r = calSorted[idx];
    if (!r) return;
    showToast('Reminder noted for "' + r.title + '" ✦');
}

function renderCalendar() {
    var list = document.getElementById('calendarList');

    calSorted = upcomingReleases
        .map(function (r) { return { title: r.title, date: r.date, daysOut: daysUntil(r.date) }; })
        .filter(function (r) { return r.daysOut >= 0; }) // drop releases that already passed
        .sort(function (a, b) { return a.daysOut - b.daysOut; });

    if (!calSorted.length) {
        list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:12.5px">No upcoming releases right now.</div>';
        return;
    }

    list.innerHTML = calSorted.map(function (r, idx) {
        var d = new Date(r.date + 'T00:00:00');
        var countLabel = r.daysOut === 0 ? 'today' : r.daysOut === 1 ? 'tomorrow' : 'in ' + r.daysOut + ' days';
        return '<div class="cal-item"><div class="cal-date-block"><div class="cal-day">' + d.getDate() + '</div><div class="cal-mon">' + d.toLocaleDateString('en-US', { month: 'short' }) + '</div></div>' +
            '<div class="cal-info"><div class="cal-title">' + esc(r.title) + '</div><div class="cal-count">' + countLabel + '</div></div>' +
            '<button class="pill-btn" onclick="calRemind(' + idx + ')">Remind me</button></div>';
    }).join('');
}

/* ============================================================
   3.2 — PRIVATE READER NOTES
   ============================================================ */
function loadPrivateNote(n) {
    var input = document.getElementById('spPrivateNote');
    var count = document.getElementById('spNotesCount');
    var saved = document.getElementById('spNotesSaved');
    if (!input || !n) return;

    input.dataset.order = String(n.order);
    input.value = privateReaderNotes[n.order] || '';
    if (count) count.textContent = input.value.length + ' / 1000';
    if (saved) {
        saved.textContent = privateReaderNotes[n.order] ? 'Saved locally' : 'Not saved yet';
        saved.classList.toggle('has-note', !!privateReaderNotes[n.order]);
    }

    if (!input.dataset.countBound) {
        input.addEventListener('input', function () {
            if (count) count.textContent = input.value.length + ' / 1000';
            if (saved) {
                saved.textContent = 'Unsaved changes';
                saved.classList.remove('has-note');
            }
        });
        input.dataset.countBound = '1';
    }
}

function savePrivateNote() {
    var input = document.getElementById('spPrivateNote');
    var saved = document.getElementById('spNotesSaved');
    if (!input || !input.dataset.order) return;

    var order = Number(input.dataset.order);
    var value = sanitize(input.value).slice(0, 1000);

    if (value) privateReaderNotes[order] = value;
    else delete privateReaderNotes[order];

    store.set('privateReaderNotes', privateReaderNotes);

    if (saved) {
        saved.textContent = value ? 'Saved locally ✓' : 'Note cleared ✓';
        saved.classList.add('has-note');
    }

    showToast(value ? 'Private note saved ✦' : 'Private note cleared ✦');
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
    if (markFlag('searchedOnce')) renderReaderAchievements();
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
            '<div class="cmdk-row-text"><div class="cmdk-row-title">' + esc(n.title) + '</div><div class="cmdk-row-sub">' + n.genres.map(function (g) { return badgeLabel[g]; }).join(' · ') + '</div></div></div>';
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
    if (e.key === 'Escape') { closeCmdk(); closeSettings(); closeSpotlight(); closeReaderMode(); return; }
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
function openSettings(section) {
    document.getElementById('settingsOverlay').classList.add('open');
    document.getElementById('settingsPanel').classList.add('open');
    if (section === 'profile') setTimeout(function () {
        var input = document.getElementById('readerProfileNameInput');
        if (input) input.focus();
    }, 180);
}
function closeSettings() { document.getElementById('settingsOverlay').classList.remove('open'); document.getElementById('settingsPanel').classList.remove('open'); }
function renderReaderProfile() {
    var name = sanitize(readerProfile.name || 'Reader').slice(0, 32) || 'Reader';
    var bio = sanitize(readerProfile.bio || '').slice(0, 140);
    var initials = name.trim().split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join('').toUpperCase() || 'R';
    var nameDisplay = document.getElementById('readerProfileNameDisplay');
    var bioDisplay = document.getElementById('readerProfileBioDisplay');
    var avatar = document.getElementById('readerProfileAvatar');
    var nameInput = document.getElementById('readerProfileNameInput');
    var bioInput = document.getElementById('readerProfileBioInput');
    if (nameDisplay) nameDisplay.textContent = name;
    if (bioDisplay) bioDisplay.textContent = bio || 'Make this reading space yours.';
    if (avatar) avatar.textContent = initials;
    if (nameInput) nameInput.value = name;
    if (bioInput) bioInput.value = bio;
}
function saveReaderProfile() {
    var nameInput = document.getElementById('readerProfileNameInput');
    var bioInput = document.getElementById('readerProfileBioInput');
    var name = sanitize(nameInput ? nameInput.value : '').slice(0, 32);
    if (!name) {
        showToast('Add a display name to save your profile.');
        if (nameInput) nameInput.focus();
        return;
    }
    readerProfile = { name: name, bio: sanitize(bioInput ? bioInput.value : '').slice(0, 140) };
    store.set('readerProfile', readerProfile);
    renderReaderProfile();
    showToast('Reader profile saved ✦');
}
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
    renderReaderProfile();
    var achievementsCollapsed = store.get('achievementsCollapsed', false);
    var achievementGrid = document.getElementById('achievementGrid');
    var achievementToggle = document.getElementById('achievementsToggle');
    if (achievementGrid && achievementToggle) {
        achievementGrid.hidden = achievementsCollapsed;
        achievementToggle.setAttribute('aria-expanded', String(!achievementsCollapsed));
        achievementToggle.innerHTML = achievementsCollapsed
            ? 'Show achievements <span aria-hidden="true">⌄</span>'
            : 'Minimize achievements <span aria-hidden="true">⌃</span>';
    }
    var defaultLightMode = document.body.classList.contains('editorial') ? 'on' : 'off';
    var wantLight = store.get('lightMode', defaultLightMode) === 'on';
    document.body.classList.toggle('light', wantLight);
    var t = document.getElementById('lightToggle');
    if (t) { t.classList.toggle('on', wantLight); t.setAttribute('aria-checked', String(wantLight)); }
    document.getElementById('motionToggle').classList.toggle('on', motionEnabled);
    document.getElementById('motionToggle').setAttribute('aria-checked', String(motionEnabled));
    initTheme();
    syncCaseClosedOccasion();

    paintAurora(moodColors.all);
    renderHero();
    renderStats();
    renderLeaderboard('views');
    renderReadingQueue();
    renderHeatmap();
    renderCalendar();

    document.addEventListener('visibilitychange', startHeroRotate);
});
/* ============================================================
   NAVIGATION DOCK
   ============================================================ */

const dockItems = document.querySelectorAll(".browser-tab:not(.browser-settings)");
dockItems.forEach(item => item.addEventListener("click", () => {
    dockItems.forEach(i => i.classList.toggle("active", i === item));
}));

if ('IntersectionObserver' in window) {
    var dockSections = Array.from(dockItems).map(function (item) {
        return { item: item, section: document.querySelector(item.getAttribute('href')) };
    }).filter(function (entry) { return !!entry.section; });
    var dockObserver = new IntersectionObserver(function (entries) {
        var visible = entries.filter(function (entry) { return entry.isIntersecting; })
            .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
        if (!visible) return;
        var active = dockSections.find(function (entry) { return entry.section === visible.target; });
        if (active) dockItems.forEach(function (item) { item.classList.toggle("active", item === active.item); });
    }, { rootMargin: "-20% 0px -55% 0px", threshold: [0, .15, .35, .6] });
    
    dockSections.forEach(function (entry) { dockObserver.observe(entry.section); });
}


/* ============================================================
   SHELF SEARCH UX
   ============================================================ */

function updateShelfSearchUI(resultCount) {
    var input = document.getElementById('shelfSearch');
    var searchBox = document.querySelector('.shelf-search');
    var info = document.getElementById('searchResultInfo');

    if (!input || !searchBox) return;

    var value = input.value.trim();
    searchBox.classList.toggle('has-value', value.length > 0);

    if (info) {
        if (!value) {
            info.textContent = 'Search titles, genres, and stories';
        } else if (typeof resultCount === 'number') {
            info.textContent = resultCount + (resultCount === 1 ? ' story' : ' stories') +
                ' found for "' + value + '"';
        } else {
            info.textContent = 'Searching the archive for "' + value + '"';
        }
    }
}

function handleShelfSearchInput() {
    updateShelfSearchUI();
    scheduleCatalogRender();
}

function clearShelfSearch() {
    var input = document.getElementById('shelfSearch');
    if (!input) return;

    input.value = '';
    updateShelfSearchUI();
    scheduleCatalogRender();
    input.focus();
}

document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        var input = document.getElementById('shelfSearch');
        if (!input) return;

        event.preventDefault();
        input.focus();
        input.select();
    }

    if (
        event.key === 'Escape' &&
        document.activeElement &&
        document.activeElement.id === 'shelfSearch'
    ) {
        clearShelfSearch();
    }
});
/* ============================================================
   THE EYE AWAKENS
============================================================ */

const EYE_KEY = "eyeLastSeen";

function shouldWakeEye(){

    const last = store.get(EYE_KEY,0);

    if(Date.now()-last < 7*24*60*60*1000) return false;

    const hour = new Date().getHours();

    const chance = (hour>=0 && hour<3) ? 0.15 : 0.01;

    return Math.random() < chance;
}

function wakeEye(){

    const eye=document.getElementById("eyeEvent");
    const pupil=document.getElementById("eyePupil");

    if(!eye||!pupil) return;

    document.body.classList.add("eye-awakened");
    eye.classList.add("active");

    store.set(EYE_KEY,Date.now());

    showToast("UNKNOWN SIGNAL DETECTED");

    function follow(e){

        const x=(e.clientX-window.innerWidth/2)*0.02;
        const y=(e.clientY-window.innerHeight/2)*0.02;

        pupil.style.transform=`translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    }

    window.addEventListener("mousemove",follow);

    const glitch=setInterval(()=>{

        document.body.style.filter="brightness(.88)";

        setTimeout(()=>document.body.style.filter="",90);

    },7000);

    setTimeout(()=>{

        eye.classList.remove("active");
        document.body.classList.remove("eye-awakened");
        window.removeEventListener("mousemove",follow);
        clearInterval(glitch);

        unlockEyeAchievement();

    },45000);
}

/* Mythic unlocks once all three of these hidden achievements are earned.
   showToast() has no queue — it just overwrites whatever's showing — so
   firing the Mythic toast right away would get stomped by the specific
   achievement's own toast below it. Each unlock function only reaches
   this point the one time its own flag flips from false to true, so
   this fires exactly once, whichever of the three completes last, and
   its toast is delayed to land just after the other one finishes. */
function announceMythicIfComplete() {
    const u = store.get("readerAchUnlocks", {});
    if (u.eyeWatcher && u.eclipseWitness && u.neonArchivist) {
        setTimeout(() => {
            showToast("🐉 Hidden Achievement: Mythic — every secret of the Library, found.");
        }, 3000);
    }
}

function unlockEyeAchievement(){

    const unlocks=store.get("readerAchUnlocks",{});

    if(unlocks.eyeWatcher) return;

    unlocks.eyeWatcher=true;

    store.set("readerAchUnlocks",unlocks);

    renderReaderAchievements();
    renderProgressJourney();

    showToast("👁 Hidden Achievement: The Watcher");

    announceMythicIfComplete();
}
document.addEventListener('DOMContentLoaded', function () {
    updateShelfSearchUI();
    setTimeout(() => {

    if(shouldWakeEye()){

        wakeEye();

    }

}, 3000);

setTimeout(() => {

    if(shouldTriggerEclipse()){

        triggerEclipse();

    }

}, 5000);
});

/* ============================================================
   ECLIPSE EVENT
   (Declared at top level — not inside DOMContentLoaded — so that
   triggerEclipse()/unlockEclipseReward() are reachable from the
   Ctrl/Cmd+Shift+E shortcut and window.debugEclipse() below, which
   live outside that handler's scope. Previously these were declared
   inside the DOMContentLoaded callback, which made them local to that
   function and undefined everywhere else — this was the bug that made
   the eclipse event impossible to trigger manually.)
============================================================ */

const ECLIPSE_KEY = "lastEclipseEvent";

function shouldTriggerEclipse()
{
setTimeout(() => {
    const cmdk = document.getElementById("cmdkInput");
    if (cmdk) cmdk.placeholder = "The library remembers who stayed...";
}, 25000);

setTimeout(() => {
    const cmdk = document.getElementById("cmdkInput");
    if (cmdk) cmdk.placeholder = "Search novels, genres, moods…";
}, 120000);


    const last = store.get(ECLIPSE_KEY,0);

    if(Date.now()-last < 7*24*60*60*1000) return false;

    const h = new Date().getHours();

    const chance = (h>=0 && h<3) ? 0.15 : 0.005;

    return Math.random() < chance;
}

function triggerEclipse(){

    const event=document.getElementById("eclipseEvent");

    if(!event) return;

    document.body.classList.add("eclipse-active");
    event.classList.add("active");

    store.set(ECLIPSE_KEY,Date.now());

    showToast("🌒 The Library has gone silent...");

    // Pick one random shelf card

   if (!document.querySelector("#catalogGrid .novel-card")) {
    renderCatalog();
}

const cards = [...document.querySelectorAll("#catalogGrid .novel-card")];

    let blessed=null;

    if(cards.length){

        blessed=cards[Math.floor(Math.random()*cards.length)];

        blessed.classList.add("eclipse-blessed");
    }

    if(blessed){

        blessed.style.pointerEvents="auto";

        blessed.addEventListener("click",unlockEclipseReward,{once:true});
    }

    setTimeout(()=>{

        event.classList.remove("active");
        document.body.classList.remove("eclipse-active");

        if(blessed)
            blessed.classList.remove("eclipse-blessed");

        showToast("The eclipse has passed.");

    },120000); // 2 minutes
}

function unlockEclipseReward(){

    const unlocks=store.get("readerAchUnlocks",{});

    if(unlocks.eclipseWitness) return;

    unlocks.eclipseWitness=true;

    store.set("readerAchUnlocks",unlocks);

    renderReaderAchievements();
    renderProgressJourney();

    showToast("🌘 Hidden Achievement: Eclipse Witness — the Library remembers you were here.");

    announceMythicIfComplete();
}
// Developer shortcut - Ctrl/Cmd + Shift + E
// Previously Alt+Shift+E: dropped because bare Alt+Shift is a reserved
// OS-level "switch keyboard language" hotkey on many Windows setups, and
// Option+E is a dead-key accent combo on Mac — both can swallow the
// keydown before the page ever sees it. Ctrl/Cmd+Shift avoids both.
document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "KeyE") {
        e.preventDefault();
        triggerEclipse();
        showToast("🌒 Developer: Eclipse triggered.");
    }
});
// Guaranteed fallback if any browser/OS/extension still eats the shortcut:
// open devtools console and run  debugEclipse()
window.debugEclipse = function () {
  if (typeof triggerEclipse === "function") {
    triggerEclipse();
  } else {
    console.error("triggerEclipse() is missing.");
  }
};
/* =========================
   KONAMI NEON MODE
========================= */

const konami = [
  "ArrowUp","ArrowUp",
  "ArrowDown","ArrowDown",
  "ArrowLeft","ArrowRight",
  "ArrowLeft","ArrowRight",
  "b","a"
];

let konamiIndex = 0;
let neonUnlocked = false;

document.addEventListener("keydown", (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

  if (key === konami[konamiIndex]) {
    konamiIndex++;

    if (konamiIndex === konami.length) {
      activateNeonMode();
      konamiIndex = 0;
    }
  } else {
    konamiIndex = 0;
  }
});

function activateNeonMode() {
  document.body.classList.add("neon-mode");

  if (!neonUnlocked) {
    unlockNeonAchievement();
    neonUnlocked = true;
  }

  setTimeout(() => {
    document.body.classList.remove("neon-mode");
  }, 10000);
}

function unlockNeonAchievement(){

    const unlocks=store.get("readerAchUnlocks",{});

    if(unlocks.neonArchivist) return;

    unlocks.neonArchivist=true;

    store.set("readerAchUnlocks",unlocks);

    renderReaderAchievements();
    renderProgressJourney();

    showToast("🕹️ Hidden Achievement: Neon Archivist — you found the old cheat code.");

    announceMythicIfComplete();
}

#!/usr/bin/env python3
"""
Build script: reads the original pasted_content.txt and produces an improved index.html
with responsive fixes, achievements section, reader dashboard, and reading goals.
"""

import re

# Read original
with open('/home/ubuntu/upload/pasted_content.txt', 'r') as f:
    src = f.read()

output = src

# ============================================================
# 1. ADD RESPONSIVE MEDIA QUERIES (before closing </style>)
# ============================================================
responsive_css = """
      /* ═══ RESPONSIVE FIXES ═══ */
      @media (max-width: 1024px) {
        .ach-grid { grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .dash-grid { grid-template-columns: repeat(2, 1fr); }
      }
      @media (max-width: 900px) {
        .library-wrap {
          grid-template-columns: 1fr;
          padding: 0 var(--sp-5) var(--sp-7);
        }
        .sidebar {
          position: static;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--sp-3);
        }
        .sidebar-card:last-child { grid-column: 1 / -1; }
        .al-scroll { max-height: none; overflow-y: visible; }
        .al-grad-top, .al-grad-bot { display: none; }
        .hero { padding: var(--sp-7) var(--sp-5) var(--sp-6); gap: var(--sp-6); }
        .updates-section, .mood-section, .mr-section, .comment-section,
        .achievements-section, .dashboard-section, .goals-section {
          padding-left: var(--sp-5); padding-right: var(--sp-5);
        }
        .site-nav { padding: 0 var(--sp-5); }
        .announcement { padding-left: var(--sp-5); padding-right: var(--sp-5); }
        .ach-grid { grid-template-columns: repeat(2, 1fr); }
      }
      @media (max-width: 768px) {
        .dash-grid { grid-template-columns: 1fr; }
      }
      @media (max-width: 640px) {
        .site-nav { padding: 0 var(--sp-4); height: 56px; }
        .nav-brand { font-size: 17px; }
        .nav-brand small { display: none; }
        .announcement { padding: var(--sp-2) var(--sp-4); font-size: 9.5px; }
        .hero {
          grid-template-columns: 1fr;
          padding: 26px var(--sp-4) 20px;
          gap: var(--sp-5);
        }
        .hero-countdown { order: -1; }
        .hero-title { font-size: clamp(30px, 8vw, 44px); }
        .hero-sub { max-width: 100%; }
        .mood-grid { grid-template-columns: repeat(3, 1fr); }
        .mood-card { padding: 12px 8px 10px; }
        .mood-emoji { font-size: 22px; }
        .mood-label { font-size: 12px; }
        .mood-sub { display: none; }
        .updates-section, .mood-section, .mr-section, .comment-section,
        .achievements-section, .dashboard-section, .goals-section {
          padding-left: var(--sp-4); padding-right: var(--sp-4);
        }
        .carousel-nav-btn { display: none; }
        .carousel-outer { gap: 0; }
        .carousel-card { width: 240px !important; }
        .library-wrap { padding: 0 var(--sp-4) var(--sp-6); }
        .sidebar { grid-template-columns: 1fr; }
        .sidebar-card:last-child { grid-column: auto; }
        .novel-item { padding: 12px 14px; gap: var(--sp-3); }
        .cover-ph { width: 50px; height: 72px; }
        .novel-title-t { font-size: 16px; }
        .spotlight-panel { width: 100vw; max-width: 100vw; }
        .comment-form-wrap { padding: 18px var(--sp-4); }
        .comment-fields { gap: var(--sp-2); }
        .comment-input, .comment-select { min-width: 100%; flex: none; }
        .comment-footer {
          flex-direction: column; align-items: flex-start;
        }
        .comment-submit { width: 100%; text-align: center; }
        .settings-panel { width: 92vw; }
        footer { padding: 18px var(--sp-4); font-size: 9.5px; }
        .hero-stats { width: 100%; }
        .novel-grid { grid-template-columns: repeat(2, 1fr); gap: var(--sp-3); }
        .gc-cover { height: 145px; }
        .ach-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .ach-card { padding: 14px 12px; }
        .ach-card-num { font-size: 22px; }
        .goals-card { padding: var(--sp-4); }
      }
      @media (max-width: 380px) {
        .hero-title { font-size: 27px; }
        .cd-num { font-size: 27px; min-width: 38px; }
        .mood-grid { grid-template-columns: repeat(2, 1fr); }
        .ach-grid { grid-template-columns: 1fr 1fr; }
        .novel-grid { grid-template-columns: 1fr; }
      }
      @media (hover: none) {
        .pill { padding: 7px 14px; }
        .icon-btn { width: 42px; height: 42px; }
      }"""

# Insert responsive CSS before </style>
output = output.replace('    </style>', responsive_css + '\n    </style>')

# ============================================================
# 2. ADD NEW SECTION CSS before closing </style>
# ============================================================
new_section_css = """
      /* ═══ ACHIEVEMENTS SECTION ═══ */
      .achievements-section {
        max-width: 1080px; margin: 0 auto;
        padding: 0 var(--sp-6) var(--sp-8);
      }
      .ach-grid {
        display: grid; grid-template-columns: repeat(4, 1fr);
        gap: 14px; margin-top: var(--sp-5);
      }
      .ach-card {
        background: var(--surface); border: 1px solid var(--border);
        border-radius: var(--r-md); padding: 20px 16px;
        text-align: center; position: relative; overflow: hidden;
        transition: all var(--tr);
        clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
      }
      .ach-card::before {
        content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px;
        background: var(--plum); transform: scaleX(0);
        transform-origin: left; transition: transform 0.4s ease;
      }
      .ach-card:hover::before { transform: scaleX(1); }
      .ach-card:hover {
        transform: translateY(-4px); box-shadow: var(--shadow-md);
        border-color: var(--plum);
      }
      .ach-card-emoji { font-size: 28px; margin-bottom: 8px; display: block; }
      .ach-card-num {
        font-family: var(--font-mono); font-size: 26px; font-weight: 500;
        color: var(--plum); line-height: 1; font-variant-numeric: tabular-nums;
      }
      .ach-card-label {
        font-family: var(--font-display); font-style: italic;
        font-size: 13px; color: var(--ink); margin-top: 6px; line-height: 1.3;
      }
      .ach-card-sub {
        font-size: 9px; font-family: var(--font-mono);
        color: var(--mauve); margin-top: 4px; letter-spacing: 0.04em;
      }

      /* ═══ READER DASHBOARD ═══ */
      .dashboard-section {
        max-width: 1080px; margin: 0 auto;
        padding: 0 var(--sp-6) var(--sp-7);
      }
      .dash-grid {
        display: grid; grid-template-columns: repeat(3, 1fr);
        gap: 14px; margin-top: var(--sp-5);
      }
      .dash-card {
        background: var(--surface); border: 1px solid var(--border);
        border-radius: var(--r-md); padding: 18px;
        transition: all var(--tr);
        clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
      }
      .dash-card:hover {
        transform: translateY(-2px); box-shadow: var(--shadow-sm);
        border-color: var(--mauve);
      }
      .dash-card-header {
        font-family: var(--font-mono); font-size: 9px;
        letter-spacing: 0.18em; text-transform: uppercase;
        color: var(--mauve); margin-bottom: 10px;
        display: flex; align-items: center; gap: 6px;
      }
      .dash-card-val {
        font-family: var(--font-display); font-size: 22px;
        font-weight: 500; color: var(--ink); font-style: italic;
      }
      .dash-card-sub {
        font-size: 10px; color: var(--mauve);
        font-family: var(--font-mono); margin-top: 4px;
      }
      .dash-continue {
        margin-top: 12px; display: block; padding: 8px 14px;
        border-radius: var(--r-sm); background: var(--ink);
        color: var(--paper); border: none; font-family: var(--font-body);
        font-size: 11.5px; cursor: pointer; transition: all var(--tr);
        text-decoration: none; text-align: center;
      }
      .dash-continue:hover { background: var(--plum); }
      .dash-recent-list {
        margin-top: 10px; display: flex;
        flex-direction: column; gap: 5px;
      }
      .dash-recent-item {
        display: flex; align-items: center; gap: 8px;
        padding: 7px 10px; border-radius: var(--r-sm);
        border: 1px solid var(--border); font-size: 12px;
        color: var(--ink); text-decoration: none; transition: all var(--tr);
      }
      .dash-recent-item:hover { background: var(--cream); border-color: var(--plum); }
      .dash-recent-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--plum); flex-shrink: 0;
      }
      .dash-streak-fire { font-size: 36px; line-height: 1; }
      .dash-streak-num {
        font-family: var(--font-mono); font-size: 32px;
        font-weight: 500; color: var(--plum); line-height: 1;
      }
      .dash-favorites-list {
        margin-top: 10px; display: flex;
        flex-direction: column; gap: 5px;
      }
      .dash-fav-item {
        display: flex; align-items: center; gap: 8px;
        padding: 7px 10px; border-radius: var(--r-sm);
        border: 1px solid var(--border); font-size: 12px;
        color: var(--ink); transition: all var(--tr); cursor: pointer;
      }
      .dash-fav-item:hover { background: var(--cream); border-color: var(--plum); }
      .dash-fav-remove {
        margin-left: auto; background: none; border: none;
        color: var(--mauve); cursor: pointer; font-size: 13px;
        opacity: 0.4; transition: opacity var(--tr);
      }
      .dash-fav-remove:hover { opacity: 1; color: var(--plum); }

      /* ═══ READING GOALS ═══ */
      .goals-section {
        max-width: 1080px; margin: 0 auto;
        padding: 0 var(--sp-6) var(--sp-8);
      }
      .goals-card {
        background: var(--cream); border: 1.5px solid var(--ink);
        border-radius: var(--r-md); padding: var(--sp-5);
        margin-top: var(--sp-5); position: relative; overflow: hidden;
        box-shadow: var(--shadow-md);
        clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%);
      }
      .goals-header {
        font-family: var(--font-display); font-weight: 600;
        font-size: 20px; color: var(--ink); margin-bottom: var(--sp-3);
        display: flex; align-items: center; gap: 10px;
      }
      .goals-set-row {
        display: flex; align-items: center; gap: 12px;
        margin-bottom: var(--sp-5); flex-wrap: wrap;
      }
      .goals-set-label { font-size: 13px; color: var(--mauve); }
      .goals-input {
        width: 70px; padding: 8px 12px; border: 1px solid var(--border);
        border-radius: var(--r-sm); font-family: var(--font-mono);
        font-size: 15px; text-align: center; background: var(--surface);
        color: var(--ink); transition: border-color var(--tr);
      }
      .goals-input:focus { border-color: var(--plum); box-shadow: var(--focus-ring); }
      .goals-set-btn {
        padding: 8px 18px; border-radius: var(--r-sm);
        background: var(--ink); color: var(--paper); border: none;
        font-family: var(--font-body); font-size: 12px;
        cursor: pointer; transition: all var(--tr);
      }
      .goals-set-btn:hover { background: var(--plum); }
      .goals-progress-wrap { margin-bottom: var(--sp-4); }
      .goals-progress-bar {
        height: 10px; background: var(--surface); border-radius: 5px;
        overflow: hidden; border: 1px solid var(--border);
      }
      .goals-progress-fill {
        height: 100%; background: linear-gradient(90deg, var(--plum), var(--blush));
        border-radius: 5px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
      }
      .goals-progress-fill::after {
        content: ""; position: absolute; inset: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        animation: shimmer 2s infinite;
      }
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .goals-stats {
        display: flex; justify-content: space-between;
        align-items: center; flex-wrap: wrap; gap: 8px;
      }
      .goals-pct {
        font-family: var(--font-mono); font-size: 28px;
        font-weight: 500; color: var(--plum);
      }
      .goals-count { font-family: var(--font-mono); font-size: 13px; color: var(--mauve); }
      .goals-add-chapter {
        margin-top: 14px; display: flex; gap: 8px;
        align-items: center; flex-wrap: wrap;
      }
      .goals-add-select {
        flex: 1; min-width: 200px; padding: 8px 12px;
        border: 1px solid var(--border); border-radius: var(--r-sm);
        font-family: var(--font-body); font-size: 12px;
        background: var(--surface); color: var(--ink); cursor: pointer;
      }
      .goals-add-btn {
        padding: 8px 18px; border-radius: var(--r-sm);
        background: var(--plum); color: white; border: none;
        font-family: var(--font-body); font-size: 12px;
        cursor: pointer; transition: all var(--tr);
      }
      .goals-add-btn:hover { background: var(--ink); }
      .goals-milestones {
        display: flex; gap: 8px; margin-top: var(--sp-4); flex-wrap: wrap;
      }
      .goals-milestone {
        padding: 6px 12px; border-radius: var(--r-sm);
        font-family: var(--font-mono); font-size: 10px;
        letter-spacing: 0.04em; border: 1px solid var(--border);
        color: var(--mauve); transition: all var(--tr);
      }
      .goals-milestone.earned {
        background: var(--plum); color: white; border-color: var(--plum);
      }
      .goals-milestone.next {
        border-color: var(--plum); color: var(--plum);
      }
"""

# Insert before </style>
output = output.replace('    </style>', new_section_css + '\n    </style>')

# ============================================================
# 3. ADD HTML SECTIONS before the </body> tag
# ============================================================
new_html = """
    <!-- ═══ ACHIEVEMENTS SECTION ═══ -->
    <div class="achievements-section">
      <div class="section-header">
        <h2 class="section-title">Achievements</h2>
        <span class="section-count">Community milestones</span>
      </div>
      <div class="ach-grid" id="achGrid">
        <div class="ach-card" data-target="100000" data-prefix="" data-suffix="+">
          <span class="ach-card-emoji">📚</span>
          <div class="ach-card-num" data-counter>0</div>
          <div class="ach-card-label">Total Reads</div>
          <div class="ach-card-sub">Across all novels</div>
        </div>
        <div class="ach-card" data-target="5000" data-prefix="" data-suffix="+">
          <span class="ach-card-emoji">❤️</span>
          <div class="ach-card-num" data-counter>0</div>
          <div class="ach-card-label">Community Likes</div>
          <div class="ach-card-sub">From our readers</div>
        </div>
        <div class="ach-card" data-target="20" data-prefix="" data-suffix="+">
          <span class="ach-card-emoji">📖</span>
          <div class="ach-card-num" data-counter>0</div>
          <div class="ach-card-label">Original Chapters</div>
          <div class="ach-card-sub">Published</div>
        </div>
        <div class="ach-card" data-target="4.8" data-prefix="" data-suffix="" data-decimal="true">
          <span class="ach-card-emoji">⭐</span>
          <div class="ach-card-num" data-counter>0</div>
          <div class="ach-card-label">Reader Rating</div>
          <div class="ach-card-sub">Average score</div>
        </div>
        <div class="ach-card" data-target="52" data-prefix="" data-suffix="">
          <span class="ach-card-emoji">🔥</span>
          <div class="ach-card-num" data-counter>0</div>
          <div class="ach-card-label">Weekly Updates</div>
          <div class="ach-card-sub">Consistent delivery</div>
        </div>
        <div class="ach-card" data-target="1" data-prefix="" data-suffix="">
          <span class="ach-card-emoji">🏆</span>
          <div class="ach-card-num" data-counter>0</div>
          <div class="ach-card-label">Featured Author</div>
          <div class="ach-card-sub">Original fiction</div>
        </div>
        <div class="ach-card" data-target="12" data-prefix="" data-suffix="+">
          <span class="ach-card-emoji">🌍</span>
          <div class="ach-card-num" data-counter>0</div>
          <div class="ach-card-label">Countries</div>
          <div class="ach-card-sub">Worldwide readership</div>
        </div>
        <div class="ach-card" data-target="4" data-prefix="" data-suffix="">
          <span class="ach-card-emoji">✍️</span>
          <div class="ach-card-num" data-counter>0</div>
          <div class="ach-card-label">Novel Series</div>
          <div class="ach-card-sub">Ongoing sagas</div>
        </div>
      </div>
    </div>

    <!-- ═══ READER DASHBOARD ═══ -->
    <div class="dashboard-section">
      <div class="section-header">
        <h2 class="section-title">Reader Dashboard</h2>
        <span class="section-count">Your personal reading hub</span>
      </div>
      <div class="dash-grid" id="dashGrid">
        <div class="dash-card">
          <div class="dash-card-header">📖 Continue Reading</div>
          <div class="dash-card-val" id="dashContinueTitle">No book yet</div>
          <div class="dash-card-sub" id="dashContinueSub">Pick a novel to start</div>
          <a class="dash-continue" id="dashContinueBtn" href="#" style="display:none">Continue →</a>
        </div>
        <div class="dash-card">
          <div class="dash-card-header">🕐 Recently Opened</div>
          <div class="dash-recent-list" id="dashRecentList">
            <div style="font-size:12px;color:var(--mauve);font-style:italic">No recent activity</div>
          </div>
        </div>
        <div class="dash-card">
          <div class="dash-card-header">🔥 Reading Streak</div>
          <div style="display:flex;align-items:center;gap:12px;margin-top:4px">
            <span class="dash-streak-fire">🔥</span>
            <span class="dash-streak-num" id="dashStreak">0</span>
          </div>
          <div class="dash-card-sub" id="dashStreakSub">days in a row</div>
        </div>
        <div class="dash-card">
          <div class="dash-card-header">📊 Total Chapters Read</div>
          <div class="dash-card-val" id="dashTotalChapters">0</div>
          <div class="dash-card-sub" id="dashTotalSub">across all novels</div>
        </div>
        <div class="dash-card">
          <div class="dash-card-header">📈 Reading Progress</div>
          <div class="np-bar" style="margin-top:6px;margin-bottom:8px">
            <div class="np-fill" id="dashProgressFill" style="width:0%"></div>
          </div>
          <div class="dash-card-val" id="dashProgressPct">0%</div>
          <div class="dash-card-sub" id="dashProgressSub">of the library complete</div>
        </div>
        <div class="dash-card">
          <div class="dash-card-header">💗 Favorite Novels</div>
          <div class="dash-favorites-list" id="dashFavList">
            <div style="font-size:12px;color:var(--mauve);font-style:italic">No favorites yet</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ READING GOALS ═══ -->
    <div class="goals-section">
      <div class="section-header">
        <h2 class="section-title">Reading Goals</h2>
        <span class="section-count">Track your daily targets</span>
      </div>
      <div class="goals-card">
        <div class="goals-header">📋 Your Daily Reading Goal</div>
        <div class="goals-set-row">
          <span class="goals-set-label">I want to read</span>
          <input type="number" class="goals-input" id="goalsInput" min="1" max="30" value="5" aria-label="Daily chapter goal" />
          <span class="goals-set-label">chapters per day</span>
          <button class="goals-set-btn" onclick="setGoal()">Set Goal</button>
        </div>
        <div class="goals-progress-wrap">
          <div class="goals-progress-bar">
            <div class="goals-progress-fill" id="goalsFill" style="width:0%"></div>
          </div>
        </div>
        <div class="goals-stats">
          <div class="goals-pct" id="goalsPct">0%</div>
          <div class="goals-count" id="goalsCount">0 / 5 chapters today</div>
        </div>
        <div class="goals-add-chapter">
          <select class="goals-add-select" id="goalsAddSelect" aria-label="Select novel">
            <option value="">Select a novel to mark a chapter read…</option>
          </select>
          <button class="goals-add-btn" onclick="addGoalChapter()">+1 Chapter</button>
        </div>
        <div class="goals-milestones" id="goalsMilestones">
          <div class="goals-milestone" data-threshold="5">5 — First Step</div>
          <div class="goals-milestone" data-threshold="10">10 — Dedicated</div>
          <div class="goals-milestone" data-threshold="25">25 — Devoted</div>
          <div class="goals-milestone" data-threshold="50">50 — Scholar</div>
          <div class="goals-milestone" data-threshold="100">100 — Legendary</div>
        </div>
      </div>
    </div>
"""

# Insert before </body>
output = output.replace('  </body>', new_html + '  </body>')

# ============================================================
# 4. ADD JAVASCRIPT before closing </script>
# ============================================================
new_js = """
      /* ═══════════════════════════════════════════════
         ACHIEVEMENT COUNTERS
      ═══════════════════════════════════════════════ */
      function animateCounters() {
        var cards = document.querySelectorAll('[data-counter]');
        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              animateOne(entry.target);
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.3 });
        cards.forEach(function(card) { observer.observe(card); });
      }
      function animateOne(el) {
        var card = el.closest('.ach-card');
        var target = parseFloat(card.dataset.target);
        var isDecimal = card.dataset.decimal === 'true';
        var prefix = card.dataset.prefix || '';
        var suffix = card.dataset.suffix || '';
        var duration = 1800;
        var start = null;
        function step(ts) {
          if (!start) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          var current = target * eased;
          el.textContent = prefix + (isDecimal ? current.toFixed(1) : Math.floor(current)) + suffix;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }

      /* ═══════════════════════════════════════════════
         READER DASHBOARD
      ═══════════════════════════════════════════════ */
      function loadDashboard() {
        var readProgress = getStorage('readProgress', {});
        var currentlyReading = getStorage('currentlyReading', null);
        var totalChapters = 0;
        var totalAllChapters = 0;

        // Count total chapters read
        Object.values(readProgress).forEach(function(order) {
          totalChapters += order ? parseInt(order) : 0;
        });

        // Count total chapters in library
        if (typeof novels !== 'undefined') {
          novels.forEach(function(n) { totalAllChapters += (n.chapters || 1); });
        } else {
          totalAllChapters = 66; // fallback
        }

        // Continue reading card
        var crTitle = document.getElementById('dashContinueTitle');
        var crSub = document.getElementById('dashContinueSub');
        var crBtn = document.getElementById('dashContinueBtn');
        if (currentlyReading !== null && typeof novels !== 'undefined') {
          var crNovel = novels[currentlyReading];
          if (crNovel) {
            var crRead = readProgress[crNovel.order] || 0;
            crTitle.textContent = crNovel.title.length > 28 ? crNovel.title.slice(0, 28) + '…' : crNovel.title;
            crSub.textContent = 'Ch. ' + crRead + ' of ' + crNovel.chapters;
            crBtn.href = crNovel.link || '#';
            crBtn.style.display = 'block';
          }
        }

        // Recently opened (from readProgress, top 3)
        var recentList = document.getElementById('dashRecentList');
        var entries = Object.entries(readProgress).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 3);
        if (entries.length > 0 && typeof novels !== 'undefined') {
          var html = '';
          entries.forEach(function(entry) {
            var novel = novels.find(function(n) { return n.order === entry[0]; });
            if (novel) {
              html += '<a class="dash-recent-item" href="' + (novel.link || '#') + '">' +
                '<span class="dash-recent-dot"></span>' +
                '<span>' + (novel.title.length > 24 ? novel.title.slice(0, 24) + '…' : novel.title) + '</span>' +
                '<span style="margin-left:auto;font-family:var(--font-mono);font-size:10px;color:var(--mauve)">Ch.' + entry[1] + '</span>' +
                '</a>';
            }
          });
          recentList.innerHTML = html;
        }

        // Streak
        var streakData = getStorage('readingStreak', { count: 0, lastDate: null });
        var today = new Date().toDateString();
        var yesterday = new Date(Date.now() - 86400000).toDateString();
        if (streakData.lastDate === today) {
          // already counted today
        } else if (streakData.lastDate === yesterday) {
          // consecutive day, streak continues
        } else {
          streakData.count = 0;
        }
        var streakEl = document.getElementById('dashStreak');
        streakEl.textContent = streakData.count || 0;
        var streakSub = document.getElementById('dashStreakSub');
        streakSub.textContent = (streakData.count || 0) === 1 ? 'day in a row' : 'days in a row';

        // Total chapters
        document.getElementById('dashTotalChapters').textContent = totalChapters;
        document.getElementById('dashTotalSub').textContent = 'across all novels';

        // Reading progress
        var pct = totalAllChapters > 0 ? Math.round((totalChapters / totalAllChapters) * 100) : 0;
        document.getElementById('dashProgressFill').style.width = pct + '%';
        document.getElementById('dashProgressPct').textContent = pct + '%';
        document.getElementById('dashProgressSub').textContent = 'of the library complete';

        // Favorites
        var favs = getStorage('novelFavorites', []);
        var favList = document.getElementById('dashFavList');
        if (favs.length > 0 && typeof novels !== 'undefined') {
          var fhtml = '';
          favs.forEach(function(favIdx) {
            var novel = novels[favIdx];
            if (novel) {
              fhtml += '<div class="dash-fav-item" data-idx="' + favIdx + '" onclick="openSpotlight(' + favIdx + ')">' +
                '<span style="color:var(--plum)">♥</span>' +
                '<span>' + (novel.title.length > 22 ? novel.title.slice(0, 22) + '…' : novel.title) + '</span>' +
                '<button class="dash-fav-remove" onclick="event.stopPropagation();removeFav(' + favIdx + ')" aria-label="Remove favorite">✕</button>' +
                '</div>';
            }
          });
          favList.innerHTML = fhtml;
        }
      }

      function removeFav(idx) {
        var favs = getStorage('novelFavorites', []);
        favs = favs.filter(function(i) { return i !== idx; });
        store.set('novelFavorites', favs);
        loadDashboard();
        showToast('Removed from favorites');
      }

      function getStorage(key, fallback) {
        try {
          var v = store.get(key, null);
          if (v === null) return fallback;
          return JSON.parse(v);
        } catch(e) { return fallback; }
      }

      /* ═══════════════════════════════════════════════
         READING GOALS
      ═══════════════════════════════════════════════ */
      function loadGoals() {
        // Populate select with novels
        var sel = document.getElementById('goalsAddSelect');
        if (sel && typeof novels !== 'undefined') {
          var opts = '<option value="">Select a novel to mark a chapter read…</option>';
          novels.forEach(function(n, i) {
            opts += '<option value="' + i + '">' + n.title + '</option>';
          });
          sel.innerHTML = opts;
        }

        var goals = getStorage('readingGoals', { daily: 5, today: 0, lastDate: null, total: 0 });
        var today = new Date().toDateString();
        if (goals.lastDate !== today) {
          goals.today = 0;
          goals.lastDate = today;
          store.set('readingGoals', JSON.stringify(goals));
        }
        renderGoals(goals);
      }

      function setGoal() {
        var input = document.getElementById('goalsInput');
        var val = parseInt(input.value);
        if (isNaN(val) || val < 1 || val > 30) {
          showToast('Please enter a number between 1 and 30');
          return;
        }
        var goals = getStorage('readingGoals', { daily: 5, today: 0, lastDate: null, total: 0 });
        goals.daily = val;
        store.set('readingGoals', JSON.stringify(goals));
        renderGoals(goals);
        showToast('Goal set to ' + val + ' chapters/day!');
      }

      function addGoalChapter() {
        var sel = document.getElementById('goalsAddSelect');
        if (!sel || !sel.value) {
          showToast('Select a novel first');
          return;
        }
        var goals = getStorage('readingGoals', { daily: 5, today: 0, lastDate: null, total: 0 });
        var today = new Date().toDateString();
        if (goals.lastDate !== today) { goals.today = 0; goals.lastDate = today; }

        goals.today += 1;
        goals.total = (goals.total || 0) + 1;

        // Update streak
        var streak = getStorage('readingStreak', { count: 0, lastDate: null });
        var yesterday = new Date(Date.now() - 86400000).toDateString();
        if (streak.lastDate === today) {
          // already streaked today
        } else if (streak.lastDate === yesterday) {
          streak.count = (streak.count || 0) + 1;
        } else {
          streak.count = 1;
        }
        streak.lastDate = today;
        store.set('readingStreak', JSON.stringify(streak));

        store.set('readingGoals', JSON.stringify(goals));
        renderGoals(goals);
        showToast('+1 chapter! Keep going!');
        loadDashboard();
      }

      function renderGoals(goals) {
        var daily = goals.daily || 5;
        var today = goals.today || 0;
        var pct = Math.min(100, Math.round((today / daily) * 100));
        var fill = document.getElementById('goalsFill');
        if (fill) fill.style.width = pct + '%';
        var pctEl = document.getElementById('goalsPct');
        if (pctEl) pctEl.textContent = pct + '%';
        var countEl = document.getElementById('goalsCount');
        if (countEl) countEl.textContent = today + ' / ' + daily + ' chapters today';

        // Input
        var input = document.getElementById('goalsInput');
        if (input) input.value = daily;

        // Milestones
        var total = goals.total || today;
        var milestones = document.querySelectorAll('.goals-milestone');
        milestones.forEach(function(m) {
          var threshold = parseInt(m.dataset.threshold);
          m.classList.remove('earned', 'next');
          if (total >= threshold) {
            m.classList.add('earned');
          } else {
            var allThresholds = Array.from(milestones).map(function(mm) { return parseInt(mm.dataset.threshold); }).sort(function(a,b){return a-b;});
            var nextTh = allThresholds.find(function(t) { return t > total; });
            if (m.dataset.threshold == String(nextTh)) m.classList.add('next');
          }
        });
      }

      /* ═══════════════════════════════════════════════
         INIT NEW FEATURES
      ═══════════════════════════════════════════════ */
      (function initNewFeatures() {
        // Achievement counters
        animateCounters();

        // Dashboard
        if (document.getElementById('dashGrid')) {
          loadDashboard();
        }

        // Goals
        if (document.getElementById('goalsFill')) {
          loadGoals();
        }
      })();
"""

# Insert before the closing </script>
output = output.replace('    </script>', new_js + '\n    </script>')

# ============================================================
# 5. FIX: Add favorites to LocalStorage (spotlight bookmark)
# ============================================================
# The existing bookmark function just sets currentlyReading.
# We add a favorites list alongside it.

bookmark_fix = """      function toggleBookmark() {
        var idx = currentNovelIndex;
        if (idx === null) return;
        var isBookmarked = currentlyReading === idx;
        if (isBookmarked) {
          currentlyReading = null;
          document.getElementById('spBookmarkBtn').classList.remove('bookmarked');
          document.getElementById('spBookmarkBtn').textContent = '🔖 Set as Currently Reading';
          store.set('currentlyReading', null);
          refreshCRCard();
          showToast('Removed from current reading');
        } else {
          currentlyReading = idx;
          document.getElementById('spBookmarkBtn').classList.add('bookmarked');
          document.getElementById('spBookmarkBtn').textContent = '✓ Currently Reading';
          store.set('currentlyReading', idx);
          refreshCRCard();
          // Also add to favorites
          var favs = [];
          try { var raw = store.get('novelFavorites'); if (raw) favs = JSON.parse(raw); } catch(e) {}
          if (!favs.includes(idx)) {
            favs.unshift(idx);
            if (favs.length > 10) favs = favs.slice(0, 10);
            store.set('novelFavorites', JSON.stringify(favs));
          }
          showToast('Set as currently reading');
          loadDashboard();
        }
      }"""

# Replace the existing toggleBookmark
old_bookmark_pattern = r'function toggleBookmark\(\) \{[\s\S]*?store\.set\("currentlyReading", idx\);\s*refreshCRCard\(\);\s*showToast.*?\n\s*\}'
output = re.sub(old_bookmark_pattern, bookmark_fix, output, count=1)

# ============================================================
# 6. FIX: Update init handler to call new features
# ============================================================
# The init function is inside window.addEventListener("load", ...).
# We already added a self-executing function for new features at the end.
# But let's also make sure loadDashboard runs on init too.

init_addition = """
        buildCarousel();
        refreshAll();
        handleListScroll();
        renderComments();
        loadDashboard();
        loadGoals();"""

output = output.replace(
    'buildCarousel();\n        refreshAll();\n        handleListScroll();\n        renderComments();',
    init_addition
)

# ============================================================
# 7. FIX: Make carousel cards responsive
# ============================================================
# Replace hardcoded 265px with dynamic calculation
carousel_fix_old = '265'
carousel_fix_new = 'Math.min(265, Math.floor((containerWidth - 48 - cardGap * 5) / 3))'

# Actually, let's just make the card width use minmax instead
# The original uses: card.style.width = '265px'
# Let's find and fix the carousel card width assignment

# Find the line that sets card width
output = output.replace(
    "card.style.width = '265px'",
    "card.style.width = 'clamp(240px, calc((100vw - 160px) / 3), 265px)'"
)

# ============================================================
# 8. FIX: Mobile nav - add hamburger for small screens
# ============================================================
# We'll add a mobile menu toggle via CSS since the nav only has 2 buttons
# which already work on mobile. No change needed there.

# ============================================================
# 9. FIX: Spotlight panel width on tablet
# ============================================================
# Already handled via the responsive CSS we added (.spotlight-panel { width: 100vw })

# ============================================================
# 10. FIX: Novel grid minmax for small screens
# ============================================================
# Already handled via responsive CSS

# ============================================================
# 11. FIX: Add the currentlyReading refresh on init
# ============================================================
# The existing refreshCRCard is called in refreshAll, so we're good.

# ============================================================
# 12. Add achievement scroll animation trigger
# ============================================================
# Already in the animateCounters function above

# Write output
with open('/home/ubuntu/novel-web/index.html', 'w') as f:
    f.write(output)

print("Build complete!")
print(f"Output size: {len(output)} chars")
print(f"Original size: {len(src)} chars")
print(f"Added: {len(output) - len(src)} chars")

# Verify key elements exist
checks = [
    'achievements-section',
    'dashboard-section',
    'goals-section',
    'animateCounters',
    'loadDashboard',
    'loadGoals',
    '@media (max-width: 640px)',
    '@media (max-width: 380px)',
    'data-counter',
    'dashContinueTitle',
    'goalsFill',
]
for check in checks:
    if check in output:
        print(f"  ✓ Found: {check}")
    else:
        print(f"  ✗ MISSING: {check}")

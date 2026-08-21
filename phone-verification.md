# Version 2.8 Phone Verification

The page was rendered at a true 390×844 viewport using Chromium headless.

The first render confirmed that the compact hero, stacked reader cards, full-width mobile CTAs, and phone-sized spacing were working. It also exposed a positioning issue in the existing bottom navigation dock: the desktop `translateX(-50%)` transform remained active after the mobile `left/right/width` rules, shifting the dock partially off-screen.

A mobile override was added to remove the transform and entrance animation at widths up to 640px. A second 390×844 render completed successfully after that correction.

The corrected 390px render shows the dock fully visible across the bottom with five practical navigation controls plus the 3.0 shortcut. The 320px render switches to a single-column shelf layout, keeps the hero CTAs readable, and avoids horizontal clipping. Final checks passed for JavaScript syntax and HTML parsing at both tested phone widths.

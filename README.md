# Manga Reader

A small, self-contained website for reading manga one-handed on a phone —
scroll mode (webtoon-style) or tap/swipe page mode, your choice, with a
dark theme by default.

## Running it

Browsers block a page from loading `chapters.json` when you just double-click
`index.html` (the `file://` origin gets blocked by CORS), so it needs to be
served rather than opened directly. No Python required — pick whichever of
these is easiest for you:

**Easiest, zero installs — get a real hosted link:**
Go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag the whole
`manga-reader` folder onto the page. It instantly gives you a live URL you
can open from your phone or share with anyone. Re-drag the folder any time
you add new chapters to update it.

**If you have Node.js installed:**
```bash
npx serve .
```
then open the localhost link it prints.

**If you use VS Code:**
Install the "Live Server" extension, right-click `index.html` → *Open with Live Server*.

## Adding chapters

1. Make a new folder inside `chapters/`, e.g. `chapters/chapter-2/`.
2. Drop your page images in it, named so they sort in reading order:
   `001.jpg`, `002.jpg`, `003.jpg`, ... (leading zeros matter for 10+ pages).
3. Run:
   ```bash
   node generate_manifest.js
   ```
   This scans the `chapters/` folder and rebuilds `chapters.json` for you —
   no hand-editing JSON required. It keeps any custom titles you've already set.
   (A Python version, `generate_manifest.py`, does the same thing if you
   have Python instead of Node.)
4. Refresh the site (or re-drag the folder onto Netlify Drop). The new
   chapter appears in the library automatically.

**No Node or Python at all?** You can skip the script and edit `chapters.json`
by hand — it's just a list. Copy the existing chapter's block, paste it below,
and change the `id`, `title`, `folder`, and `pages` filenames to match your
new folder.

Want to rename a chapter? Open `chapters.json` and edit its `"title"` field —
the generator script preserves custom titles on future runs.

You can also rename the whole site: edit `"title"` at the top of `chapters.json`
(this is the wordmark shown on the library page).

The four `.svg` files in `chapters/chapter-1/` are placeholder demo pages so
the site isn't empty on first run — delete that folder (and its entry will
disappear next time you run the generator) once you've added your own chapters.

## Controls

- **Scroll mode**: just scroll, thumb-friendly, like a webtoon.
- **Page mode**: tap the right side of the screen to go forward, left side to
  go back (or swipe). Flip the **Direction** setting to *Right → Left* for
  traditional manga reading order, which swaps which side is "forward."
- Tap the middle of the page to show/hide the top bar.
- The gear button (bottom center) opens settings: mode, direction, and theme.
  These are remembered, along with your reading progress per chapter, in
  the browser's local storage on that device.

## Customizing the look

Colors, fonts, and spacing all live in `css/style.css` as CSS variables at
the top (`:root` for dark theme, `[data-theme="light"]` for light). Change
`--accent` for a different highlight color, or swap the Google Fonts link
at the top of the file for different typefaces.

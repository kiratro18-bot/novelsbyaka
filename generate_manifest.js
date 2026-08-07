#!/usr/bin/env node
/**
 * Rebuilds chapters.json by scanning the chapters/ folder.
 *
 * Usage:
 *   node generate_manifest.js
 *
 * How it works:
 *   - Every subfolder inside chapters/ becomes a chapter.
 *   - Every image file inside that subfolder becomes a page, sorted in
 *     natural reading order (001.jpg, 002.jpg, ... 010.jpg — not plain
 *     alphabetical, which would put 010 before 002).
 *   - If a chapter already exists in chapters.json, its custom "title" is
 *     kept. New chapters get an auto title based on the folder name, which
 *     you can edit by hand afterwards in chapters.json.
 *
 * Just drop a new folder of images into chapters/ (e.g. chapters/chapter-2/
 * with 001.jpg, 002.jpg, ...) and re-run this script.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CHAPTERS_DIR = path.join(ROOT, 'chapters');
const MANIFEST_PATH = path.join(ROOT, 'chapters.json');
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif']);

function naturalCompare(a, b) {
  const re = /(\d+)|(\D+)/g;
  const ax = a.match(re) || [];
  const bx = b.match(re) || [];
  const len = Math.max(ax.length, bx.length);
  for (let i = 0; i < len; i++) {
    const av = ax[i] ?? '';
    const bv = bx[i] ?? '';
    if (av === bv) continue;
    const an = /^\d+$/.test(av), bn = /^\d+$/.test(bv);
    if (an && bn) return Number(av) - Number(bv);
    return av < bv ? -1 : 1;
  }
  return 0;
}

function autoTitle(folderName) {
  const name = folderName.replace(/[-_]+/g, ' ').trim();
  return name ? name[0].toUpperCase() + name.slice(1) : folderName;
}

function main() {
  if (!fs.existsSync(CHAPTERS_DIR)) {
    console.error(`No chapters/ folder found at ${CHAPTERS_DIR}`);
    process.exit(1);
  }

  let existing = { title: 'My Manga', chapters: [] };
  if (fs.existsSync(MANIFEST_PATH)) {
    try { existing = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')); } catch (e) { /* ignore, start fresh */ }
  }
  const existingById = new Map((existing.chapters || []).map(c => [c.id, c]));

  const folderNames = fs.readdirSync(CHAPTERS_DIR)
    .filter(d => fs.statSync(path.join(CHAPTERS_DIR, d)).isDirectory())
    .sort(naturalCompare);

  const chapters = [];
  for (const folderName of folderNames) {
    const folderPath = path.join(CHAPTERS_DIR, folderName);
    const pages = fs.readdirSync(folderPath)
      .filter(f => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
      .sort(naturalCompare);

    if (!pages.length) {
      console.log(`  skipping '${folderName}' (no image files found)`);
      continue;
    }

    const prior = existingById.get(folderName);
    const title = (prior && prior.title) ? prior.title : autoTitle(folderName);

    chapters.push({ id: folderName, title, folder: `chapters/${folderName}`, pages });
    console.log(`  ${folderName}: ${pages.length} page(s) -> "${title}"`);
  }

  const manifest = { title: existing.title || 'My Manga', chapters };
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nWrote ${MANIFEST_PATH} with ${chapters.length} chapter(s).`);
}

main();

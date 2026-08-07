#!/usr/bin/env python3
"""
Rebuilds chapters.json by scanning the chapters/ folder.

Usage:
    python3 generate_manifest.py

How it works:
  - Every subfolder inside chapters/ becomes a chapter.
  - Every image file inside that subfolder becomes a page, sorted in
    natural reading order (001.jpg, 002.jpg, ... 010.jpg, not alphabetical
    which would put 010 before 002... this script handles that correctly).
  - If a chapter already exists in chapters.json, its custom "title" is
    kept. New chapters get an auto title based on the folder name, which
    you can edit by hand afterwards in chapters.json.

Just drop a new folder of images into chapters/ (e.g. chapters/chapter-2/
with 001.jpg, 002.jpg, ...) and re-run this script.
"""

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
CHAPTERS_DIR = os.path.join(ROOT, "chapters")
MANIFEST_PATH = os.path.join(ROOT, "chapters.json")

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"}


def natural_key(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]


def auto_title(folder_name):
    name = re.sub(r"[-_]+", " ", folder_name).strip()
    return name[:1].upper() + name[1:] if name else folder_name


def main():
    if not os.path.isdir(CHAPTERS_DIR):
        print(f"No chapters/ folder found at {CHAPTERS_DIR}")
        sys.exit(1)

    existing = {"title": "My Manga", "chapters": []}
    if os.path.exists(MANIFEST_PATH):
        try:
            with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            pass

    existing_by_id = {c["id"]: c for c in existing.get("chapters", [])}

    folder_names = sorted(
        [d for d in os.listdir(CHAPTERS_DIR) if os.path.isdir(os.path.join(CHAPTERS_DIR, d))],
        key=natural_key,
    )

    chapters = []
    for folder_name in folder_names:
        folder_path = os.path.join(CHAPTERS_DIR, folder_name)
        pages = sorted(
            [f for f in os.listdir(folder_path) if os.path.splitext(f)[1].lower() in IMAGE_EXTS],
            key=natural_key,
        )
        if not pages:
            print(f"  skipping '{folder_name}' (no image files found)")
            continue

        prior = existing_by_id.get(folder_name)
        title = prior["title"] if prior and prior.get("title") else auto_title(folder_name)

        chapters.append(
            {
                "id": folder_name,
                "title": title,
                "folder": f"chapters/{folder_name}",
                "pages": pages,
            }
        )
        print(f"  {folder_name}: {len(pages)} page(s) -> \"{title}\"")

    manifest = {"title": existing.get("title", "My Manga"), "chapters": chapters}

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"\nWrote {MANIFEST_PATH} with {len(chapters)} chapter(s).")


if __name__ == "__main__":
    main()

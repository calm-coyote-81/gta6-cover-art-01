[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/calm-coyote-81/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/calm-coyote-81/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice City Cover Maker — gta6-cover-art-01

An entry for make.fun's "Make GTA 6 Cover Art" bounty: an offline web app
that turns a photo and a caption into multi-panel GTA-style poster cover
art and exports it as a PNG to share.

## What it does

- **Any photo:** upload your own photos or try the two included samples.
  Photos stay on your machine — nothing is uploaded.
- **Multi-panel posters:** three layouts — Poster (hero panel over two
  side panels), Strip (three vertical panels) and Hero (one full-bleed
  photo). Fill several panels with one photo or several, click a panel
  to crop and position it with zoom and slide controls.
- **Caption:** an editable title and subtitle in bold condensed lettering
  with a sunset fill and a neon subtitle bar.
- **Colour grades:** Sunset, Neon, Mono and Halftone, all drawn on canvas
  with warm gradients, vignette and dot screens.
- **Post sizes:** 1080×1080, 1080×1350 and 1920×1080, exported as PNG
  with one click. Fully offline: no network requests, system fonts only,
  no Rockstar logos, artwork or fonts.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/app/`, `out/screenshots/` and `out/dossier.json`.

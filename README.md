<img src="public/favicon.svg" width="32" height="32" alt="" align="left" />

# Taronic

Minimal SVG card editor for drawing tarot deck art by hand: drop icons on a card-shaped
canvas, transform them, save your work, export SVG. Not a Pyxie feature — a standalone
tool for making Pyxie deck art offline. No build step ships icons at runtime; no server,
no accounts, everything lives in the browser tab.

Live at **[trickyholley.github.io/taronic](https://trickyholley.github.io/taronic/)**
(deploys automatically on push to `main` — see `.github/workflows/deploy.yml`).

## Use it

```bash
pnpm install
pnpm dev
```

Opens at `http://localhost:5190/taronic/` (the `/taronic/` prefix matches the deployed
GitHub Pages path — see `vite.config.ts`'s `base`).

- Drag an icon from the left palette onto the card. Search filters the palette.
- Click a placed icon to select it; drag it around the canvas directly, or use the right
  panel for color / rotation / size. `Delete`/`Backspace` removes the selected icon.
- The **Layers** list (bottom right) shows stacking order, front-most first — click to
  select, ✕ to delete. "Bring to front" / "Send to back" reorder the selected icon.
- **Background** color picker (top bar) sets the card's solid fill.
- **Save JSON** opens your OS's native save dialog (Chromium/Edge — File System Access
  API) to write a `.json` file; **Open…** reloads one. This is the editable, re-loadable
  format — keep the `.json` around if you'll want to tweak the card later. Browsers
  without that API (Firefox, Safari) fall back to a filename prompt + plain download.
- **Export SVG** likewise prompts for a save location and writes a standalone `.svg` with
  the card baked in at its native 570×1000 size — for dropping into Pyxie's deck art later
  (not wired up yet, by design — see repo issue). Save and Export share one remembered
  filename, so naming a card "the-fool.json" suggests "the-fool.svg" next.

The canvas is a fixed 570×1000 (57:100), matching Pyxie's card aspect ratio.

## Icons

Ships with the full [Lucide](https://lucide.dev) icon set (~1,500 icons, MIT-licensed),
baked in at build time — see `scripts/build-icons.mjs`.

Two ways to bring in more icons:

1. **Build-time (permanent)**: point `build-icons.mjs` at any directory of flat,
   one-`<svg>`-per-file icons (Tabler, Feather, Heroicons outline, ...) and regenerate:
   ```bash
   node scripts/build-icons.mjs path/to/icon/dir some-set-name src/icons/generated/some-set-name.ts
   ```
   Then import the result into `src/icons/manifest.ts`.
2. **Runtime (session-only)**: the "Import icon set…" button in the palette reads any
   `.svg` files you pick straight into a "Custom" section of the palette. Not persisted —
   but every icon you actually place on a card carries its own SVG markup in the saved
   JSON, so a reload never depends on the icon set still being imported.

## Format

A saved card is:

```jsonc
{
  "formatVersion": 1,
  "width": 570,
  "height": 1000,
  "background": "#1b1023",
  "icons": [
    { "instanceId": "...", "name": "Moon", "viewBox": "0 0 24 24", "svgInner": "<g .../>",
      "x": 285, "y": 300, "rotation": 20, "scale": 1.3, "color": "#ffd27a" }
  ]
}
```

`x`/`y` are the icon's center in card-space units. See `src/iconTransform.ts` for exactly
how position/rotation/scale/viewBox combine — the same logic renders the live canvas and
the exported SVG, so they can't drift apart.

## Stack

Vanilla TypeScript + native SVG DOM (no framework) on Vite. Icons are placed as real
`<g>` elements on an `<svg>` canvas, so manipulating them on-screen *is* building the
export — no separate serialization step.

The favicon (`public/favicon.svg`) is a filled Lucide `moon-star`, on-brand and legible
even at tab size — plain outline strokes turned to mush that small, so it's a solid fill.

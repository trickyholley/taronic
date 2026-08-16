<div align="center">
  <img src="public/favicon.svg" width="96" height="96" alt="" />
  <h1>Taronic</h1>
</div>

Minimal SVG card editor for drawing tarot deck art by hand — drop icons on a
card-shaped canvas, transform them, export SVG. No server, no accounts,
everything lives in the browser tab.

Live at **[taronic.pyxietarot.live](https://taronic.pyxietarot.live/)**.

## Use it

```bash
pnpm install
pnpm dev
```

## Icons

Ships with the full [game-icons.net](https://game-icons.net) set, baked in at
build time via `pnpm icons:game-icons`.

Two ways to add more:

1. **Build-time**: point `scripts/build-icons.mjs` at a directory of `.svg`
   icons, regenerate, then import the result in `src/icons/manifest.ts`.
2. **Runtime**: "Import icon set…" in the palette loads `.svg` files into a
   session-only "Custom" section — not persisted, but placed icons carry
   their own SVG in the saved JSON.

### Attribution

game-icons.net icons are CC BY 3.0 (mostly), credited per-artist. Saved cards
carry a `credits` array generated from the icons actually placed.

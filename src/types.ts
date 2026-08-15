/** A palette entry: one icon available to drag onto the canvas. */
export interface IconDef {
  id: string;
  name: string;
  set: string;
  /** Creator to credit for this icon, e.g. for game-icons.net's per-artist CC BY
   * attribution — empty for sets (or custom imports) with no attribution to track. */
  author: string;
  viewBox: string;
  svgInner: string;
}

/** One icon instance placed on the card. Carries its own SVG markup, set, and author
 * so a saved card never depends on the icon set that produced it still being loaded,
 * and can regenerate its own credits section from just the icons it actually uses. */
export interface PlacedIcon {
  instanceId: string;
  name: string;
  set: string;
  author: string;
  viewBox: string;
  svgInner: string;
  x: number;
  y: number;
  rotation: number;
  /** On-canvas size in px — the icon's longer viewBox dimension, normalized to this. */
  size: number;
  color: string;
}

/** One creator credited for one or more icons placed on a card — see persistence.ts's
 * buildCredits, which derives this from a document's placed icons at save time. */
export interface CardCredit {
  author: string;
  set: string;
}

export interface CardDocument {
  formatVersion: 1;
  width: number;
  height: number;
  background: string;
  icons: PlacedIcon[];
}

export const CARD_WIDTH = 570;
export const CARD_HEIGHT = 1000;
/** Default size (px) for a newly placed icon. */
export const ICON_BASE_SIZE = 90;

export function emptyDocument(): CardDocument {
  return {
    formatVersion: 1,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    background: "#1b1023",
    icons: [],
  };
}

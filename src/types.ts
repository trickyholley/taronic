/** A palette entry: one icon available to drag onto the canvas. */
export interface IconDef {
  id: string;
  name: string;
  set: string;
  viewBox: string;
  svgInner: string;
}

/** One icon instance placed on the card. Carries its own SVG markup so a saved
 * card never depends on the icon set that produced it still being loaded. */
export interface PlacedIcon {
  instanceId: string;
  name: string;
  viewBox: string;
  svgInner: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
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

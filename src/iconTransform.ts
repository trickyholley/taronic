import { ICON_BASE_SIZE, type PlacedIcon } from "./types";

/** Placement transform: moves an already-centered icon to its position, rotation, and scale. */
export function outerTransform(icon: PlacedIcon): string {
  return `translate(${icon.x} ${icon.y}) rotate(${icon.rotation}) scale(${icon.scale})`;
}

/** Centers an icon's native viewBox on the origin and normalizes it to ICON_BASE_SIZE,
 * so every icon — regardless of its source set's native viewBox — behaves the same
 * under outerTransform. Shared by the live canvas render and the SVG export so they
 * can never drift apart. */
export function innerTransform(viewBox: string): string {
  const [minX, minY, vbWidth, vbHeight] = viewBox.split(/\s+/).map(Number);
  const scale = ICON_BASE_SIZE / Math.max(vbWidth, vbHeight);
  const cx = minX + vbWidth / 2;
  const cy = minY + vbHeight / 2;
  return `scale(${scale}) translate(${-cx} ${-cy})`;
}

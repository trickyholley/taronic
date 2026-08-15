import { builtInIconSets } from "./icons/manifest";
import type { IconDef } from "./types";

/** All icons currently available in the palette: build-time-baked sets plus
 * whatever's been imported this session (see importIcons.ts). Placed icons copy
 * their own markup onto the card, so this registry only matters for the palette
 * and for resolving a drag-and-drop by id. */
const registry = new Map<string, IconDef>();
for (const icon of builtInIconSets) registry.set(icon.id, icon);

export function getIcon(id: string): IconDef | undefined {
  return registry.get(id);
}

export function addCustomIcons(icons: IconDef[]) {
  for (const icon of icons) registry.set(icon.id, icon);
}

export function listIcons(): IconDef[] {
  return [...registry.values()];
}

import type { CardDocument, PlacedIcon } from "./types";

export interface PropertyRefs {
  section: HTMLElement;
  name: HTMLElement;
  color: HTMLInputElement;
  colorHex: HTMLInputElement;
  x: HTMLInputElement;
  y: HTMLInputElement;
  rotation: HTMLInputElement;
  rotationNumber: HTMLInputElement;
  size: HTMLInputElement;
  sizeNumber: HTMLInputElement;
}

/** Pure display sync — pushes the selected icon's current values into the panel
 * inputs. Event wiring happens once in app.ts so listeners never get re-attached. */
export function syncPropertiesPanel(refs: PropertyRefs, doc: CardDocument, selectedId: string | null) {
  const icon = doc.icons.find((i) => i.instanceId === selectedId);
  refs.section.hidden = !icon;
  if (!icon) return;

  refs.name.textContent = icon.author ? `${icon.name} — by ${icon.author}` : icon.name;
  refs.color.value = icon.color;
  refs.colorHex.value = icon.color;
  refs.x.value = String(Math.round(icon.x));
  refs.y.value = String(Math.round(icon.y));
  refs.rotation.value = String(icon.rotation);
  refs.rotationNumber.value = String(icon.rotation);
  refs.size.value = String(Math.round(icon.size));
  refs.sizeNumber.value = String(Math.round(icon.size));
}

export function findSelectedIcon(doc: CardDocument, selectedId: string | null): PlacedIcon | undefined {
  return doc.icons.find((i) => i.instanceId === selectedId);
}

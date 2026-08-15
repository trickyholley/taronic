import type { CardDocument, PlacedIcon } from "./types";

export interface PropertyRefs {
  section: HTMLElement;
  name: HTMLElement;
  color: HTMLInputElement;
  colorHex: HTMLInputElement;
  rotation: HTMLInputElement;
  rotationNumber: HTMLInputElement;
  scale: HTMLInputElement;
  scaleNumber: HTMLInputElement;
}

/** Pure display sync — pushes the selected icon's current values into the panel
 * inputs. Event wiring happens once in app.ts so listeners never get re-attached. */
export function syncPropertiesPanel(refs: PropertyRefs, doc: CardDocument, selectedId: string | null) {
  const icon = doc.icons.find((i) => i.instanceId === selectedId);
  refs.section.hidden = !icon;
  if (!icon) return;

  refs.name.textContent = icon.name;
  refs.color.value = icon.color;
  refs.colorHex.value = icon.color;
  refs.rotation.value = String(icon.rotation);
  refs.rotationNumber.value = String(icon.rotation);
  refs.scale.value = String(icon.scale);
  refs.scaleNumber.value = String(icon.scale);
}

export function findSelectedIcon(doc: CardDocument, selectedId: string | null): PlacedIcon | undefined {
  return doc.icons.find((i) => i.instanceId === selectedId);
}

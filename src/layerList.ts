import type { CardDocument } from "./types";

/** Renders the layer list top-to-bottom in stacking order (last-drawn/front-most first),
 * mirroring how the icons overlap on the canvas. */
export function renderLayerList(
  list: HTMLOListElement,
  doc: CardDocument,
  selectedId: string | null,
  onSelect: (id: string) => void,
  onDelete: (id: string) => void,
) {
  list.replaceChildren();
  for (const icon of [...doc.icons].reverse()) {
    const row = document.createElement("li");
    row.className = "layer-row" + (icon.instanceId === selectedId ? " selected" : "");

    const name = document.createElement("span");
    name.className = "layer-name";
    name.textContent = icon.name;
    row.appendChild(name);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "✕";
    deleteButton.title = "Delete";
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      onDelete(icon.instanceId);
    });
    row.appendChild(deleteButton);

    row.addEventListener("click", () => onSelect(icon.instanceId));
    list.appendChild(row);
  }

  if (doc.icons.length === 0) {
    const empty = document.createElement("li");
    empty.className = "layer-row";
    empty.textContent = "No icons placed yet";
    list.appendChild(empty);
  }
}

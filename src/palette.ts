import { parseImportedSvgFiles } from "./importIcons";
import { addCustomIcons, listIcons } from "./iconRegistry";
import type { IconDef } from "./types";

/** Wires the icon palette: search filtering, drag-source setup, and runtime
 * "Import icon set…" for any flat-SVG icon pack (see importIcons.ts). */
export function setupPalette(refs: {
  grid: HTMLElement;
  search: HTMLInputElement;
  importButton: HTMLButtonElement;
  importInput: HTMLInputElement;
}) {
  let query = "";

  function renderGrid() {
    const icons = listIcons().filter((icon) => icon.name.toLowerCase().includes(query));
    refs.grid.replaceChildren();
    for (const icon of icons) {
      refs.grid.appendChild(buildSwatch(icon));
    }
  }

  function buildSwatch(icon: IconDef): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "icon-swatch";
    button.type = "button";
    button.title = icon.name;
    button.draggable = true;
    // icon.svgInner is trusted here — see the comment in canvasRender.ts.
    button.innerHTML = `<svg viewBox="${icon.viewBox}">${icon.svgInner}</svg>`;
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", icon.id);
      event.dataTransfer!.effectAllowed = "copy";
    });
    return button;
  }

  refs.search.addEventListener("input", () => {
    query = refs.search.value.trim().toLowerCase();
    renderGrid();
  });

  refs.importButton.addEventListener("click", () => refs.importInput.click());
  refs.importInput.addEventListener("change", async () => {
    if (!refs.importInput.files?.length) return;
    const icons = await parseImportedSvgFiles(refs.importInput.files);
    addCustomIcons(icons);
    refs.importInput.value = "";
    renderGrid();
  });

  renderGrid();
}

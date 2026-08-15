import "./style.css";
import { App } from "./app";
import { setupPalette } from "./palette";
import { buildExportSvg, exportDocumentAsSvg, loadDocumentFromFile, saveDocumentAsJson } from "./persistence";

function el<T extends Element>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing #${id}`);
  return found as unknown as T;
}

const app = new App({
  svg: el<SVGSVGElement>("card-canvas"),
  layerList: el<HTMLOListElement>("layer-list"),
  background: el<HTMLInputElement>("input-background"),
  properties: {
    section: el<HTMLElement>("icon-properties"),
    name: el<HTMLElement>("selected-icon-name"),
    color: el<HTMLInputElement>("input-color"),
    colorHex: el<HTMLInputElement>("input-color-hex"),
    x: el<HTMLInputElement>("input-x"),
    y: el<HTMLInputElement>("input-y"),
    rotation: el<HTMLInputElement>("input-rotation"),
    rotationNumber: el<HTMLInputElement>("input-rotation-number"),
    scale: el<HTMLInputElement>("input-scale"),
    scaleNumber: el<HTMLInputElement>("input-scale-number"),
  },
});

el<HTMLInputElement>("input-default-icon-color").value = app.defaultIconColor;

const status = el<HTMLElement>("status");
function flashStatus(message: string) {
  status.textContent = message;
  setTimeout(() => {
    if (status.textContent === message) status.textContent = "";
  }, 2000);
}

setupPalette({
  grid: el<HTMLElement>("icon-grid"),
  search: el<HTMLInputElement>("icon-search"),
  importButton: el<HTMLButtonElement>("btn-import-icons"),
  importInput: el<HTMLInputElement>("file-import-icons"),
});

// Toolbar
el<HTMLButtonElement>("btn-new").addEventListener("click", () => {
  if (app.doc.icons.length === 0 || confirm("Discard the current card and start a new one?")) {
    app.newDocument();
  }
});

el<HTMLButtonElement>("btn-load").addEventListener("click", () => el<HTMLInputElement>("file-load").click());
el<HTMLInputElement>("file-load").addEventListener("change", async (event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    app.loadDocument(await loadDocumentFromFile(file));
    flashStatus(`Loaded ${file.name}`);
  } catch (err) {
    alert(err instanceof Error ? err.message : "Could not load that file");
  } finally {
    input.value = "";
  }
});

// Save and export share one remembered base name so exporting a card you just
// named "the-fool.json" suggests "the-fool.svg" rather than resetting to "card".
let filenameBase = "card";

el<HTMLButtonElement>("btn-save").addEventListener("click", async () => {
  const filename = await saveDocumentAsJson(app.doc, `${filenameBase}.json`);
  if (!filename) return;
  filenameBase = filename.replace(/\.json$/i, "");
  flashStatus(`Saved ${filename}`);
});

el<HTMLButtonElement>("btn-export-svg").addEventListener("click", async () => {
  const filename = await exportDocumentAsSvg(app.doc, `${filenameBase}.svg`);
  if (!filename) return;
  filenameBase = filename.replace(/\.svg$/i, "");
  flashStatus(`Exported ${filename}`);
});

el<HTMLInputElement>("input-background").addEventListener("input", (event) => {
  app.setBackground((event.target as HTMLInputElement).value);
});

el<HTMLInputElement>("input-default-icon-color").addEventListener("input", (event) => {
  app.defaultIconColor = (event.target as HTMLInputElement).value;
});

// Properties panel (listeners wired once; app.render() only pushes values into these).
// The swatch and the hex text field both edit the same value — keep them in sync
// with each other as well as pushing to the icon.
const colorSwatch = el<HTMLInputElement>("input-color");
const colorHex = el<HTMLInputElement>("input-color-hex");
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

colorSwatch.addEventListener("input", () => {
  colorHex.value = colorSwatch.value;
  app.updateSelected({ color: colorSwatch.value });
});
colorHex.addEventListener("input", () => {
  if (!HEX_COLOR_RE.test(colorHex.value)) return;
  colorSwatch.value = colorHex.value;
  app.updateSelected({ color: colorHex.value });
});

el<HTMLInputElement>("input-x").addEventListener("input", (event) => {
  app.updateSelected({ x: Number((event.target as HTMLInputElement).value) });
});
el<HTMLInputElement>("input-y").addEventListener("input", (event) => {
  app.updateSelected({ y: Number((event.target as HTMLInputElement).value) });
});

function wireRotation(input: HTMLInputElement) {
  input.addEventListener("input", () => app.updateSelected({ rotation: Number(input.value) }));
}
wireRotation(el<HTMLInputElement>("input-rotation"));
wireRotation(el<HTMLInputElement>("input-rotation-number"));

function wireScale(input: HTMLInputElement) {
  input.addEventListener("input", () => app.updateSelected({ scale: Number(input.value) }));
}
wireScale(el<HTMLInputElement>("input-scale"));
wireScale(el<HTMLInputElement>("input-scale-number"));

el<HTMLButtonElement>("btn-bring-front").addEventListener("click", () => app.reorderSelected("front"));
el<HTMLButtonElement>("btn-send-back").addEventListener("click", () => app.reorderSelected("back"));
el<HTMLButtonElement>("btn-delete-icon").addEventListener("click", () => {
  if (app.selectedId) app.removeIcon(app.selectedId);
});

// Drag-and-drop from the palette onto the canvas.
const svg = el<SVGSVGElement>("card-canvas");
svg.addEventListener("dragover", (event) => event.preventDefault());
svg.addEventListener("drop", (event) => {
  event.preventDefault();
  const iconId = event.dataTransfer?.getData("text/plain");
  if (iconId) app.handlePaletteDrop(iconId, event.clientX, event.clientY);
});

document.addEventListener("keydown", (event) => {
  if ((event.key === "Delete" || event.key === "Backspace") && app.selectedId) {
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
    app.removeIcon(app.selectedId);
  }
});

// Refreshing/closing loses anything not saved (no autosave) — warn once there's an
// actual card in progress. The confirmation text itself is browser-controlled; most
// browsers show a generic "leave site?" message regardless of returnValue's content.
window.addEventListener("beforeunload", (event) => {
  if (app.doc.icons.length === 0) return;
  event.preventDefault();
  event.returnValue = "";
});

// Handy for quick console inspection while developing.
Object.assign(window, { taronic: { app, buildExportSvg } });

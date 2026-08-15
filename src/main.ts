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
    color: el<HTMLInputElement>("input-color"),
    rotation: el<HTMLInputElement>("input-rotation"),
    rotationNumber: el<HTMLInputElement>("input-rotation-number"),
    scale: el<HTMLInputElement>("input-scale"),
    scaleNumber: el<HTMLInputElement>("input-scale-number"),
  },
});

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

el<HTMLButtonElement>("btn-save").addEventListener("click", () => {
  saveDocumentAsJson(app.doc);
  flashStatus("Saved card.json");
});

el<HTMLButtonElement>("btn-export-svg").addEventListener("click", () => {
  exportDocumentAsSvg(app.doc);
  flashStatus("Exported card.svg");
});

el<HTMLInputElement>("input-background").addEventListener("input", (event) => {
  app.setBackground((event.target as HTMLInputElement).value);
});

// Properties panel (listeners wired once; app.render() only pushes values into these).
el<HTMLInputElement>("input-color").addEventListener("input", (event) => {
  app.updateSelected({ color: (event.target as HTMLInputElement).value });
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

// Handy for quick console inspection while developing.
Object.assign(window, { taronic: { app, buildExportSvg } });

import { innerTransform, outerTransform } from "./iconTransform";
import type { CardDocument } from "./types";

// TS's bundled DOM lib doesn't ship File System Access API types yet — typed
// locally rather than pulling in a global .d.ts for one narrow use.
interface FileSystemFileHandle {
  readonly name: string;
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
}
type ShowSaveFilePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<FileSystemFileHandle>;

function download(filename: string, contents: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Saves via the browser's native OS save dialog where available (Chromium/Edge),
 * otherwise falls back to prompting for a name and triggering a plain download
 * (Firefox/Safari don't implement showSaveFilePicker). Returns the chosen filename,
 * or null if the user cancelled. */
async function saveWithNativeDialogOrDownload(
  contents: string,
  suggestedName: string,
  mimeType: string,
  extension: string,
): Promise<string | null> {
  const showSaveFilePicker = (window as unknown as { showSaveFilePicker?: ShowSaveFilePicker }).showSaveFilePicker;
  if (showSaveFilePicker) {
    try {
      const handle = await showSaveFilePicker({
        suggestedName,
        types: [{ description: mimeType, accept: { [mimeType]: [extension] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(contents);
      await writable.close();
      return handle.name;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return null;
      throw err;
    }
  }

  const input = prompt(`Save as (${extension}):`, suggestedName);
  if (input === null) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const filename = trimmed.toLowerCase().endsWith(extension) ? trimmed : `${trimmed}${extension}`;
  download(filename, contents, mimeType);
  return filename;
}

export function saveDocumentAsJson(doc: CardDocument, suggestedName = "card.json"): Promise<string | null> {
  return saveWithNativeDialogOrDownload(JSON.stringify(doc, null, 2), suggestedName, "application/json", ".json");
}

export async function loadDocumentFromFile(file: File): Promise<CardDocument> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (parsed.formatVersion !== 1 || !Array.isArray(parsed.icons)) {
    throw new Error("Not a recognized Taronic card file");
  }
  return parsed as CardDocument;
}

/** Builds a standalone SVG document string matching the live canvas exactly,
 * suitable for dropping straight into Pyxie's deck art later. */
export function buildExportSvg(doc: CardDocument): string {
  const icons = doc.icons
    .map(
      (icon) =>
        `  <g transform="${outerTransform(icon)}" style="color:${icon.color}">\n` +
        `    <g transform="${innerTransform(icon.viewBox)}">${icon.svgInner}</g>\n  </g>`,
    )
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${doc.width} ${doc.height}" width="${doc.width}" height="${doc.height}">
  <rect x="0" y="0" width="${doc.width}" height="${doc.height}" fill="${doc.background}" />
${icons}
</svg>
`;
}

export function exportDocumentAsSvg(doc: CardDocument, suggestedName = "card.svg"): Promise<string | null> {
  return saveWithNativeDialogOrDownload(buildExportSvg(doc), suggestedName, "image/svg+xml", ".svg");
}

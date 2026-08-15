import { innerTransform, outerTransform } from "./iconTransform";
import type { CardCredit, CardDocument } from "./types";

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

/** Derives this card's attribution list from the icons actually placed on it — one
 * entry per distinct author+set, so e.g. a CC BY credits section can be generated
 * straight from a saved card without hand-tracking which icons ended up on it.
 * Icons with no author on record (custom imports) are excluded rather than guessed at. */
export function buildCredits(doc: CardDocument): CardCredit[] {
  const seen = new Map<string, CardCredit>();
  for (const icon of doc.icons) {
    if (!icon.author) continue;
    const key = `${icon.author} ${icon.set}`;
    if (!seen.has(key)) seen.set(key, { author: icon.author, set: icon.set });
  }
  return [...seen.values()].sort((a, b) => a.author.localeCompare(b.author));
}

export function saveDocumentAsJson(doc: CardDocument, suggestedName = "card.json"): Promise<string | null> {
  const withCredits = { ...doc, credits: buildCredits(doc) };
  const json = JSON.stringify(withCredits, null, 2);
  return saveWithNativeDialogOrDownload(json, suggestedName, "application/json", ".json");
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

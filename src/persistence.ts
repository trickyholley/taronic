import { innerTransform, outerTransform } from "./iconTransform";
import type { CardDocument } from "./types";

function download(filename: string, contents: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function saveDocumentAsJson(doc: CardDocument, filename = "card.json") {
  download(filename, JSON.stringify(doc, null, 2), "application/json");
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

export function exportDocumentAsSvg(doc: CardDocument, filename = "card.svg") {
  download(filename, buildExportSvg(doc), "image/svg+xml");
}

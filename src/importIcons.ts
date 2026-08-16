import { sanitizeSvgInner } from "./sanitizeSvg";
import type { IconDef } from "./types";

const SVG_OPEN_TAG_RE = /<svg\b([^>]*)>/i;
const SVG_TAG_RE = /<svg\b[^>]*>([\s\S]*)<\/svg>/i;
const VIEWBOX_RE = /viewBox="([^"]+)"/i;

function titleCase(filename: string): string {
  return filename
    .replace(/\.svg$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Mirrors scripts/build-icons.mjs's extractPresentationAttrs — most icon sets put
// fill/stroke/etc. on the root <svg> and rely on inheritance, so re-apply them to a
// wrapping <g> once that root tag is discarded, or recoloring via currentColor won't work.
function extractPresentationAttrs(openTagAttrs: string): string {
  const get = (name: string) => openTagAttrs.match(new RegExp(`${name}="([^"]*)"`, "i"))?.[1];
  const fill = get("fill");
  const stroke = get("stroke");
  const strokeWidth = get("stroke-width");
  const strokeLinecap = get("stroke-linecap");
  const strokeLinejoin = get("stroke-linejoin");

  const attrs: string[] = [];
  if (fill !== undefined) attrs.push(`fill="${fill}"`);
  else if (stroke === undefined) attrs.push(`fill="currentColor"`);
  if (stroke !== undefined) attrs.push(`stroke="${stroke}"`);
  if (strokeWidth !== undefined) attrs.push(`stroke-width="${strokeWidth}"`);
  if (strokeLinecap !== undefined) attrs.push(`stroke-linecap="${strokeLinecap}"`);
  if (strokeLinejoin !== undefined) attrs.push(`stroke-linejoin="${strokeLinejoin}"`);
  return attrs.join(" ");
}

/** Parses arbitrary user-supplied SVG files into IconDefs for the "Custom" palette
 * section — the runtime counterpart to scripts/build-icons.mjs's build-time baking.
 * Best-effort: single-color outline icons (feather, tabler, heroicons/outline, ...)
 * recolor cleanly via currentColor; multi-color icons keep their own fills. */
export async function parseImportedSvgFiles(files: FileList | File[]): Promise<IconDef[]> {
  const icons: IconDef[] = [];
  for (const file of Array.from(files)) {
    if (!file.name.endsWith(".svg")) continue;
    const raw = await file.text();
    const openTagMatch = raw.match(SVG_OPEN_TAG_RE);
    const bodyMatch = raw.match(SVG_TAG_RE);
    if (!bodyMatch || !openTagMatch) continue;
    const viewBoxMatch = raw.match(VIEWBOX_RE);
    const presentation = extractPresentationAttrs(openTagMatch[1]);
    const innerBody = bodyMatch[1].trim();
    const svgInner = presentation ? `<g ${presentation}>${innerBody}</g>` : innerBody;
    icons.push({
      id: `custom:${file.name}:${crypto.randomUUID()}`,
      name: titleCase(file.name),
      set: "custom",
      // Unknown provenance — excluded from buildCredits (persistence.ts) rather than
      // guessed at.
      author: "",
      viewBox: viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24",
      // File picked by the user, not something we authored - sanitize before it ever
      // reaches an innerHTML sink (see sanitizeSvg.ts).
      svgInner: sanitizeSvgInner(svgInner),
    });
  }
  return icons;
}

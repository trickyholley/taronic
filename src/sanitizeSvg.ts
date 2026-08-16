/** Strips XSS vectors out of arbitrary SVG markup before it ever reaches `svgInner` on
 * an IconDef/PlacedIcon. Applied once at ingestion — persistence.ts's
 * loadDocumentFromFile (opening a `.json` card someone hands you) and importIcons.ts's
 * parseImportedSvgFiles (the "Import icon set…" button) — so every downstream consumer
 * (canvasRender.ts's `innerHTML`, palette.ts's swatch `innerHTML`, persistence.ts's
 * buildExportSvg) can trust `svgInner` is inert without re-checking it themselves.
 *
 * Build-time-baked icons (src/icons/generated/*) skip this on purpose: they come from
 * build-icons.mjs pulling a pinned upstream repo at build time, not from something a
 * user handed the running app.
 *
 * Approach: parse as XML, drop elements that can execute code or load a document
 * (script, foreignObject, iframe, ...) subtree and all, strip every `on*` event-handler
 * attribute, and restrict href/xlink:href/src to a local fragment (`#foo`, for `<use>`
 * referencing a `<symbol>` in the same markup) or an inline `data:image/...` URI —
 * anything else (`javascript:`, a remote URL) is dropped rather than guessed at.
 * Markup that fails to parse as XML is dropped entirely rather than risking a broken
 * half-render. */

const BLOCKED_TAGS = new Set([
  "script",
  "foreignobject",
  "iframe",
  "embed",
  "object",
  "link",
  "meta",
  "base",
  "style",
]);

const URL_ATTRS = new Set(["href", "xlink:href", "src"]);

function isSafeUrlValue(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("#") || /^data:image\//i.test(trimmed);
}

function sanitizeElement(el: Element) {
  for (const attr of [...el.attributes]) {
    const name = attr.name.toLowerCase();
    if (name.startsWith("on")) el.removeAttribute(attr.name);
    else if (URL_ATTRS.has(name) && !isSafeUrlValue(attr.value)) el.removeAttribute(attr.name);
  }
  for (const child of [...el.children]) {
    if (BLOCKED_TAGS.has(child.tagName.toLowerCase())) child.remove();
    else sanitizeElement(child);
  }
}

/** Sanitizes a fragment of inner SVG markup (no outer `<svg>` — the shape stored in
 * `svgInner`, e.g. `<path d="..."/>` or a wrapping `<g fill="...">...</g>`). Returns
 * `""` for markup that doesn't parse as SVG rather than throwing. */
export function sanitizeSvgInner(raw: string): string {
  const doc = new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${raw}</svg>`,
    "image/svg+xml",
  );
  if (doc.querySelector("parsererror")) return "";

  const root = doc.documentElement;
  sanitizeElement(root);
  return Array.from(root.children)
    .map((child) => new XMLSerializer().serializeToString(child))
    .join("");
}

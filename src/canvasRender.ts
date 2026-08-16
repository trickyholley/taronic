import { innerTransform, outerTransform } from "./iconTransform";
import type { CardDocument } from "./types";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Rebuilds the live canvas <svg> children from the document. Cheap enough (a handful
 * to a few dozen icons per card) to do a full rebuild on every change rather than diff. */
export function renderCanvas(svg: SVGSVGElement, doc: CardDocument, selectedId: string | null) {
  svg.setAttribute("viewBox", `0 0 ${doc.width} ${doc.height}`);
  svg.replaceChildren();

  const background = document.createElementNS(SVG_NS, "rect");
  background.setAttribute("x", "0");
  background.setAttribute("y", "0");
  background.setAttribute("width", String(doc.width));
  background.setAttribute("height", String(doc.height));
  background.setAttribute("fill", doc.background);
  background.dataset.role = "background";
  svg.appendChild(background);

  for (const icon of doc.icons) {
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("transform", outerTransform(icon));
    group.setAttribute("style", `color:${icon.color}`);
    group.dataset.instanceId = icon.instanceId;
    group.classList.add("placed-icon");
    if (icon.instanceId === selectedId) group.classList.add("selected");

    const inner = document.createElementNS(SVG_NS, "g");
    inner.setAttribute("transform", innerTransform(icon.viewBox));
    // svgInner is trusted here: build-time-baked icons come from our own build step,
    // and anything loaded/imported at runtime was already run through
    // sanitizeSvg.ts's sanitizeSvgInner (persistence.ts, importIcons.ts).
    inner.innerHTML = icon.svgInner;
    group.appendChild(inner);

    if (icon.instanceId === selectedId) {
      const halo = document.createElementNS(SVG_NS, "circle");
      halo.setAttribute("cx", "0");
      halo.setAttribute("cy", "0");
      halo.setAttribute("r", "64");
      halo.setAttribute("class", "selection-halo");
      group.insertBefore(halo, inner);
    }

    svg.appendChild(group);
  }

  if (doc.label.text) svg.appendChild(buildLabelText(doc));
}

/** Bottom margin (px, card-space) between the label's baseline and the card edge - shared
 * with persistence.ts's buildExportSvg so the live canvas and exported SVG can't drift apart. */
export const LABEL_BOTTOM_MARGIN = 56;

function buildLabelText(doc: CardDocument): SVGTextElement {
  const text = document.createElementNS(SVG_NS, "text");
  text.setAttribute("x", String(doc.width / 2));
  text.setAttribute("y", String(doc.height - LABEL_BOTTOM_MARGIN));
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("font-size", String(doc.label.fontSize));
  text.setAttribute("fill", doc.label.color);
  text.setAttribute("font-family", "Georgia, 'Times New Roman', serif");
  text.dataset.role = "label";
  text.textContent = doc.label.text;
  return text;
}

/** Converts a pointer/mouse event's screen coordinates into the SVG's own user-space
 * coordinates, accounting for however the element is currently scaled on screen. */
export function screenToSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };
  const transformed = point.matrixTransform(matrix.inverse());
  return { x: transformed.x, y: transformed.y };
}

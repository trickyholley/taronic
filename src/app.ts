import { renderCanvas, screenToSvgPoint } from "./canvasRender";
import { getIcon } from "./iconRegistry";
import { renderLayerList } from "./layerList";
import { findSelectedIcon, syncPropertiesPanel, type PropertyRefs } from "./propertiesPanel";
import { emptyDocument, type CardDocument, type IconDef, type PlacedIcon } from "./types";

export interface AppRefs {
  svg: SVGSVGElement;
  layerList: HTMLOListElement;
  background: HTMLInputElement;
  properties: PropertyRefs;
}

const DEFAULT_ICON_COLOR = "#f2e9dc";

/** Owns the card document and all mutation entry points; every mutation ends in a
 * full render() (see canvasRender.ts — cheap at this scale, no need to diff). */
export class App {
  doc: CardDocument = emptyDocument();
  selectedId: string | null = null;

  constructor(private refs: AppRefs) {
    this.wireCanvasDragToMove();
    this.render();
  }

  render() {
    renderCanvas(this.refs.svg, this.doc, this.selectedId);
    renderLayerList(
      this.refs.layerList,
      this.doc,
      this.selectedId,
      (id) => this.select(id),
      (id) => this.removeIcon(id),
    );
    syncPropertiesPanel(this.refs.properties, this.doc, this.selectedId);
    this.refs.background.value = this.doc.background;
  }

  select(id: string | null) {
    this.selectedId = id;
    this.render();
  }

  addIconAt(def: IconDef, x: number, y: number) {
    const instance: PlacedIcon = {
      instanceId: crypto.randomUUID(),
      name: def.name,
      viewBox: def.viewBox,
      svgInner: def.svgInner,
      x,
      y,
      rotation: 0,
      scale: 1,
      color: DEFAULT_ICON_COLOR,
    };
    this.doc.icons.push(instance);
    this.selectedId = instance.instanceId;
    this.render();
  }

  updateSelected(patch: Partial<Pick<PlacedIcon, "color" | "rotation" | "scale">>) {
    const icon = findSelectedIcon(this.doc, this.selectedId);
    if (!icon) return;
    Object.assign(icon, patch);
    this.render();
  }

  removeIcon(id: string) {
    this.doc.icons = this.doc.icons.filter((i) => i.instanceId !== id);
    if (this.selectedId === id) this.selectedId = null;
    this.render();
  }

  reorderSelected(direction: "front" | "back") {
    if (!this.selectedId) return;
    const idx = this.doc.icons.findIndex((i) => i.instanceId === this.selectedId);
    if (idx === -1) return;
    const [icon] = this.doc.icons.splice(idx, 1);
    if (direction === "front") this.doc.icons.push(icon);
    else this.doc.icons.unshift(icon);
    this.render();
  }

  setBackground(color: string) {
    this.doc.background = color;
    this.render();
  }

  newDocument() {
    this.doc = emptyDocument();
    this.selectedId = null;
    this.render();
  }

  loadDocument(doc: CardDocument) {
    this.doc = doc;
    this.selectedId = null;
    this.render();
  }

  handlePaletteDrop(iconId: string, clientX: number, clientY: number) {
    const def = getIcon(iconId);
    if (!def) return;
    const point = screenToSvgPoint(this.refs.svg, clientX, clientY);
    this.addIconAt(def, point.x, point.y);
  }

  /** Drag-to-reposition for icons already on the canvas. Grabs the pointer's offset
   * from the icon's center at pointerdown so the icon doesn't jump to the cursor. */
  private wireCanvasDragToMove() {
    let dragId: string | null = null;
    let offset = { x: 0, y: 0 };

    this.refs.svg.addEventListener("pointerdown", (event) => {
      const target = (event.target as Element).closest<SVGGElement>("[data-instance-id]");
      if (!target) {
        this.select(null);
        return;
      }
      const instanceId = target.dataset.instanceId!;
      const icon = this.doc.icons.find((i) => i.instanceId === instanceId);
      if (!icon) return;
      this.select(instanceId);
      dragId = instanceId;
      const point = screenToSvgPoint(this.refs.svg, event.clientX, event.clientY);
      offset = { x: point.x - icon.x, y: point.y - icon.y };
      this.refs.svg.setPointerCapture(event.pointerId);
    });

    this.refs.svg.addEventListener("pointermove", (event) => {
      if (!dragId) return;
      const icon = this.doc.icons.find((i) => i.instanceId === dragId);
      if (!icon) return;
      const point = screenToSvgPoint(this.refs.svg, event.clientX, event.clientY);
      icon.x = point.x - offset.x;
      icon.y = point.y - offset.y;
      this.render();
    });

    const endDrag = () => {
      dragId = null;
    };
    this.refs.svg.addEventListener("pointerup", endDrag);
    this.refs.svg.addEventListener("pointercancel", endDrag);
  }
}

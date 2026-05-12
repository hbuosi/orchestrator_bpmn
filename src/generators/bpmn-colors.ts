import { BpmnModdle } from 'bpmn-moddle';
import { BPMN_COLORS, type ColorKey } from '../constants/colors.js';
import type { BpmnProcess, BpmnElement, BpmnBranch as Branch } from '../schemas/bpmn-elements.schema.js';

const moddle = new BpmnModdle();

// Applies BPMN in Color Spec colors directly to BPMNDI XML attributes.
// This is the persistent approach — colors survive save/reload.
// color:background-color / color:border-color per OMG MIWG 2014 spec.
export async function applyColors(
  layoutedXml: string,
  process: BpmnProcess,
): Promise<string> {
  const { rootElement: definitions } = await moddle.fromXML(layoutedXml);

  const colorMap = buildColorMap(process.elements);

  const diagram = (definitions as { diagrams?: Array<{ plane: { planeElement: Array<{ id: string; bpmnElement: { id: string } }> } }> })
    .diagrams?.[0];

  if (!diagram) return layoutedXml;

  for (const shape of diagram.plane.planeElement) {
    const elementId = shape.bpmnElement?.id;
    if (!elementId) continue;

    const colorKey = colorMap.get(elementId);
    if (!colorKey) continue;

    const palette = BPMN_COLORS[colorKey];
    // Set BPMN in Color Spec attributes
    (shape as Record<string, unknown>)['color:background-color'] = palette.fill;
    (shape as Record<string, unknown>)['color:border-color'] = palette.stroke;
  }

  const { xml } = await moddle.toXML(definitions, { format: true });
  return xml;
}

function buildColorMap(elements: BpmnElement[], map = new Map<string, ColorKey>()): Map<string, ColorKey> {
  for (const el of elements) {
    if (el.colorKey) map.set(el.id, el.colorKey);

    if ('branches' in el) {
      for (const branch of el.branches as Branch[]) {
        buildColorMap(branch.path, map);
      }
    }
    if ('elements' in el) {
      buildColorMap((el as { elements: BpmnElement[] }).elements, map);
    }
  }
  return map;
}

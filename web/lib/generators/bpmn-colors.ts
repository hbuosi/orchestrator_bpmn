import { BPMN_COLORS } from '../constants/colors';
import type { BpmnProcess, BpmnElement, BpmnBranch as Branch } from '../schemas/bpmn-elements.schema';

type ColorKey = keyof typeof BPMN_COLORS;

export async function applyColors(
  bpmnXml: string,
  process: BpmnProcess,
): Promise<string> {
  const colorMap = buildColorMap(process.elements);
  return injectColors(bpmnXml, colorMap);
}

function injectColors(xml: string, colorMap: Map<string, ColorKey>): string {
  return xml.replace(
    /<bpmndi:BPMNShape\b([^>]*)>/g,
    (match, attrs: string) => {
      const m = /bpmnElement="([^"]+)"/.exec(attrs);
      if (!m || !m[1]) return match;

      const colorKey = colorMap.get(m[1]);
      if (!colorKey) return match;

      const p = BPMN_COLORS[colorKey] as { fill: string; stroke: string };
      const colorAttrs =
        ` bioc:fill="${p.fill}" bioc:stroke="${p.stroke}"` +
        ` color:background-color="${p.fill}" color:border-color="${p.stroke}"`;
      return `<bpmndi:BPMNShape${attrs}${colorAttrs}>`;
    }
  );
}

function inferColorKey(type: string): ColorKey {
  if (type === 'startEvent') return 'happy';
  if (type === 'endEvent') return 'happy';
  if (type === 'serviceTask' || type === 'scriptTask') return 'system';
  if (type === 'userTask' || type === 'manualTask') return 'manual';
  if (type.toLowerCase().includes('gateway')) return 'decision' as ColorKey;
  if (type === 'subProcess') return 'subprocess';
  return 'default';
}

function buildColorMap(
  elements: BpmnElement[],
  map = new Map<string, ColorKey>(),
): Map<string, ColorKey> {
  for (const el of elements) {
    map.set(el.id, (el.colorKey as ColorKey | undefined) ?? inferColorKey(el.type));
    if ('branches' in el) {
      for (const b of (el as { branches: Branch[] }).branches) buildColorMap(b.path, map);
    }
    if ('elements' in el) {
      buildColorMap((el as { elements: BpmnElement[] }).elements, map);
    }
  }
  return map;
}

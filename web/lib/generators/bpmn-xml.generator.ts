import type { BpmnProcess, BpmnElement, BpmnBranch } from '../schemas/bpmn-elements.schema';

const SIZES: Record<string, { w: number; h: number }> = {
  startEvent: { w: 36, h: 36 },
  endEvent: { w: 36, h: 36 },
  intermediateCatchEvent: { w: 36, h: 36 },
  intermediateThrowEvent: { w: 36, h: 36 },
  exclusiveGateway: { w: 50, h: 50 },
  parallelGateway: { w: 50, h: 50 },
  inclusiveGateway: { w: 50, h: 50 },
  eventBasedGateway: { w: 50, h: 50 },
  subProcess: { w: 200, h: 80 },
};
const TASK_SIZE = { w: 120, h: 80 };
const GAP_X = 60;
const BRANCH_GAP_X = 150;
const GAP_Y = 60;
const ORIGIN_X = 30;
const ORIGIN_Y = 240;

interface Bounds { x: number; y: number; w: number; h: number; }
interface FlowSpec { id: string; source: string; target: string; name?: string; }

interface LayoutCtx {
  shapes: Map<string, Bounds>;
  flows: FlowSpec[];
  flowN: number;
  shapeTypes: Map<string, string>;
}

function getSize(type: string): { w: number; h: number } {
  return SIZES[type] ?? TASK_SIZE;
}

function isGatewayType(type: string): boolean {
  return ['exclusiveGateway', 'parallelGateway', 'inclusiveGateway', 'eventBasedGateway'].includes(type);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function toBpmnTag(type: string): string {
  const map: Record<string, string> = {
    task: 'bpmn:task', userTask: 'bpmn:userTask', serviceTask: 'bpmn:serviceTask',
    scriptTask: 'bpmn:scriptTask', manualTask: 'bpmn:manualTask',
    sendTask: 'bpmn:sendTask', receiveTask: 'bpmn:receiveTask',
    startEvent: 'bpmn:startEvent', endEvent: 'bpmn:endEvent',
    intermediateCatchEvent: 'bpmn:intermediateCatchEvent',
    intermediateThrowEvent: 'bpmn:intermediateThrowEvent',
    exclusiveGateway: 'bpmn:exclusiveGateway',
    parallelGateway: 'bpmn:parallelGateway',
    inclusiveGateway: 'bpmn:inclusiveGateway',
    eventBasedGateway: 'bpmn:eventBasedGateway',
    subProcess: 'bpmn:subProcess',
  };
  return map[type] ?? 'bpmn:task';
}

function pathHeight(path: BpmnElement[]): number {
  let max = TASK_SIZE.h;
  for (const el of path) {
    if (isGatewayType(el.type)) {
      const branches = (el as { branches: BpmnBranch[] }).branches;
      const totalH = branches.reduce((sum, b) => sum + pathHeight(b.path), 0)
        + Math.max(0, branches.length - 1) * GAP_Y;
      max = Math.max(max, totalH);
    }
  }
  return max;
}

function layoutPath(
  elements: BpmnElement[],
  x: number,
  cy: number,
  prevId: string | null,
  ctx: LayoutCtx,
): { nextX: number; lastId: string | null } {
  let cur = x;
  let prev = prevId;

  for (const el of elements) {
    const size = getSize(el.type);
    ctx.shapeTypes.set(el.id, el.type);

    if (isGatewayType(el.type)) {
      ctx.shapes.set(el.id, { x: cur, y: cy - size.h / 2, w: size.w, h: size.h });
      if (prev) ctx.flows.push({ id: `Flow_${++ctx.flowN}`, source: prev, target: el.id });

      const branchStartX = cur + size.w + BRANCH_GAP_X;
      const branches = (el as { branches: BpmnBranch[] }).branches;

      const branchHeights = branches.map(b => pathHeight(b.path));
      const totalH = branchHeights.reduce((s, h) => s + h, 0) + Math.max(0, branches.length - 1) * GAP_Y;

      let branchTopY = cy - totalH / 2;
      let maxEndX = branchStartX;
      const nonTerminalEnds: string[] = [];

      for (let i = 0; i < branches.length; i++) {
        const branch = branches[i]!;
        const bH = branchHeights[i] ?? TASK_SIZE.h;
        const bcy = branchTopY + bH / 2;

        if (branch.path.length === 0) {
          branchTopY += bH + GAP_Y;
          continue;
        }

        const flowsBefore = ctx.flows.length;
        const result = layoutPath(branch.path, branchStartX, bcy, el.id, ctx);

        if (ctx.flows.length > flowsBefore && branch.condition) {
          ctx.flows[flowsBefore]!.name = branch.condition;
        }

        maxEndX = Math.max(maxEndX, result.nextX);
        const lastBranchEl = branch.path[branch.path.length - 1];
        if (result.lastId && lastBranchEl?.type !== 'endEvent') {
          nonTerminalEnds.push(result.lastId);
        }

        branchTopY += bH + GAP_Y;
      }

      if (nonTerminalEnds.length > 0) {
        const joinId = `Gateway_join_${el.id}`;
        ctx.shapeTypes.set(joinId, 'exclusiveGateway');
        ctx.shapes.set(joinId, { x: maxEndX, y: cy - size.h / 2, w: size.w, h: size.h });
        for (const lid of nonTerminalEnds) {
          ctx.flows.push({ id: `Flow_${++ctx.flowN}`, source: lid, target: joinId });
        }
        prev = joinId;
        cur = maxEndX + size.w + GAP_X;
      } else {
        prev = null;
        cur = maxEndX;
      }
    } else {
      ctx.shapes.set(el.id, { x: cur, y: cy - size.h / 2, w: size.w, h: size.h });
      if (prev) ctx.flows.push({ id: `Flow_${++ctx.flowN}`, source: prev, target: el.id });
      prev = el.id;
      cur += size.w + GAP_X;
    }
  }

  return { nextX: cur, lastId: prev };
}

function flowGeometry(src: Bounds, tgt: Bounds): {
  x1: number; y1: number; x2: number; y2: number; midX: number; straight: boolean;
} {
  const x1 = src.x + src.w;
  const y1 = Math.round(src.y + src.h / 2);
  const x2 = tgt.x;
  const y2 = Math.round(tgt.y + tgt.h / 2);
  const straight = Math.abs(y1 - y2) <= 6;
  const midX = Math.round(x1 + (x2 - x1) / 2);
  return { x1, y1, x2, y2, midX, straight };
}

function waypoints(src: Bounds, tgt: Bounds): string {
  const { x1, y1, x2, y2, midX, straight } = flowGeometry(src, tgt);
  const pts = (pairs: [number, number][]): string =>
    pairs.map(([x, y]) => `        <di:waypoint x="${x}" y="${y}" />`).join('\n');
  if (straight) return pts([[x1, y1], [x2, y2]]);
  return pts([[x1, y1], [midX, y1], [midX, y2], [x2, y2]]);
}

function labelBounds(
  src: Bounds, tgt: Bounds, name: string,
): { x: number; y: number; w: number; h: number } | null {
  if (!name) return null;
  const { x1, y1, x2, y2, midX, straight } = flowGeometry(src, tgt);
  if (straight) {
    const lw = Math.max(name.length * 6 + 10, 40);
    return { x: Math.round(midX - lw / 2), y: y1 - 18, w: lw, h: 14 };
  }
  const corridorW = Math.max(x2 - midX - 12, 30);
  const rawW = name.length * 6 + 10;
  const lw = Math.min(rawW, corridorW);
  const lh = rawW > corridorW ? 28 : 14;
  const my = Math.round((y1 + y2) / 2);
  return { x: midX + 6, y: my - Math.round(lh / 2), w: lw, h: lh };
}

function collectElements(elements: BpmnElement[], out: BpmnElement[] = []): BpmnElement[] {
  for (const el of elements) {
    out.push(el);
    if ('branches' in el) {
      for (const b of (el as { branches: BpmnBranch[] }).branches) collectElements(b.path, out);
    }
    if ('elements' in el) collectElements((el as { elements: BpmnElement[] }).elements, out);
  }
  return out;
}

export async function generateBpmnXml(process: BpmnProcess): Promise<string> {
  const ctx: LayoutCtx = {
    shapes: new Map(), flows: [], flowN: 0, shapeTypes: new Map(),
  };

  const { lastId } = layoutPath(process.elements, ORIGIN_X, ORIGIN_Y, null, ctx);

  if (lastId) {
    const sz = getSize('endEvent');
    const last = ctx.shapes.get(lastId)!;
    const endId = `EndEvent_implicit`;
    ctx.shapeTypes.set(endId, 'endEvent');
    ctx.shapes.set(endId, {
      x: last.x + last.w + GAP_X,
      y: ORIGIN_Y - sz.h / 2,
      w: sz.w, h: sz.h,
    });
    ctx.flows.push({ id: `Flow_${++ctx.flowN}`, source: lastId, target: endId });
  }

  const allElements = collectElements(process.elements);
  const processLines: string[] = [];

  for (const el of allElements) {
    const tag = toBpmnTag(el.type);
    processLines.push(`    <${tag} id="${el.id}" name="${esc(el.label)}" />`);
  }

  for (const [id] of ctx.shapeTypes) {
    if (id.startsWith('Gateway_join_')) {
      processLines.push(`    <bpmn:exclusiveGateway id="${id}" name="" gatewayDirection="Converging" />`);
    }
    if (id.startsWith('EndEvent_implicit')) {
      processLines.push(`    <bpmn:endEvent id="${id}" name="End" />`);
    }
  }

  const flowLines = ctx.flows.map(f =>
    `    <bpmn:sequenceFlow id="${f.id}" name="${esc(f.name ?? '')}" sourceRef="${f.source}" targetRef="${f.target}" />`
  );

  const shapeLines: string[] = [];
  for (const [id, b] of ctx.shapes) {
    const type = ctx.shapeTypes.get(id) ?? 'task';
    const isGw = isGatewayType(type) || id.startsWith('Gateway_join_');
    const extra = isGw ? ' isMarkerVisible="true"' : '';
    shapeLines.push(
      `      <bpmndi:BPMNShape id="${id}_di" bpmnElement="${id}"${extra}>\n` +
      `        <dc:Bounds x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" />\n` +
      `      </bpmndi:BPMNShape>`
    );
  }

  const edgeLines: string[] = [];
  for (const f of ctx.flows) {
    const src = ctx.shapes.get(f.source);
    const tgt = ctx.shapes.get(f.target);
    if (!src || !tgt) continue;
    const lb = labelBounds(src, tgt, f.name ?? '');
    const labelXml = lb
      ? `\n        <bpmndi:BPMNLabel>\n          <dc:Bounds x="${lb.x}" y="${lb.y}" width="${lb.w}" height="${lb.h}" />\n        </bpmndi:BPMNLabel>`
      : '';
    edgeLines.push(
      `      <bpmndi:BPMNEdge id="${f.id}_di" bpmnElement="${f.id}">\n` +
      waypoints(src, tgt) +
      labelXml + '\n' +
      `      </bpmndi:BPMNEdge>`
    );
  }

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<bpmn:definitions`,
    `  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"`,
    `  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"`,
    `  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"`,
    `  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"`,
    `  xmlns:bioc="http://bpmn.io/schema/bpmn/biocolor/1.0"`,
    `  xmlns:color="http://www.omg.org/spec/BPMN/non-normative/color/1.0"`,
    `  targetNamespace="http://bpmn.io/schema/bpmn">`,
    `  <bpmn:process id="${process.id}" name="${esc(process.name)}" isExecutable="false">`,
    ...processLines,
    ...flowLines,
    `  </bpmn:process>`,
    `  <bpmndi:BPMNDiagram id="BPMNDiagram_${process.id}">`,
    `    <bpmndi:BPMNPlane id="BPMNPlane_${process.id}" bpmnElement="${process.id}">`,
    ...shapeLines,
    ...edgeLines,
    `    </bpmndi:BPMNPlane>`,
    `  </bpmndi:BPMNDiagram>`,
    `</bpmn:definitions>`,
  ].join('\n');
}

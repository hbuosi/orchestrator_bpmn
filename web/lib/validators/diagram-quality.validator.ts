/**
 * Diagram Quality Checklist v1.1 — 12-rule validator
 * Source: research/Business_Service_Design_Framework_v2.6/Shared/Diagram_Quality_Checklist_v1.1.md
 */

type QEl = {
  type: string;
  id: string;
  label?: string;
  colorKey?: string;
  branches?: Array<{ condition: string; path: QEl[] }>;
  elements?: QEl[];
};

type Participant = { id: string; name: string };

export type QualityRuleStatus = 'pass' | 'fail' | 'advisory' | 'na';

export type QualityRuleResult = {
  rule: number;
  name: string;
  status: QualityRuleStatus;
  detail: string;
};

const TASK_TYPES = new Set(['task', 'userTask', 'serviceTask', 'scriptTask', 'manualTask', 'sendTask', 'receiveTask']);
const EVENT_TYPES = new Set(['startEvent', 'endEvent', 'intermediateCatchEvent', 'intermediateThrowEvent']);
const GATEWAY_TYPES = new Set(['exclusiveGateway', 'parallelGateway', 'inclusiveGateway', 'eventBasedGateway']);

function collectAll(elements: QEl[]): QEl[] {
  const all: QEl[] = [];
  for (const el of elements) {
    all.push(el);
    if (el.branches) for (const b of el.branches) all.push(...collectAll(b.path));
    if (el.elements) all.push(...collectAll(el.elements));
  }
  return all;
}

function countShapes(elements: QEl[]): number {
  return collectAll(elements).filter(
    e => TASK_TYPES.has(e.type) || EVENT_TYPES.has(e.type) || GATEWAY_TYPES.has(e.type),
  ).length;
}

/**
 * Measures the diagram width in logical columns by finding the longest
 * horizontal path through the element tree.
 * - Each task/event/gateway = 1 column
 * - Gateway contributes 1 (for itself) + max(branch depths)
 * - SubProcess contributes 1 + its internal depth
 */
export function measureDiagramColumns(elements: QEl[]): number {
  let total = 0;
  for (const el of elements) {
    if (GATEWAY_TYPES.has(el.type) && el.branches && el.branches.length > 0) {
      const maxBranch = Math.max(0, ...el.branches.map(b => measureDiagramColumns(b.path)));
      total += 1 + maxBranch;
    } else if (el.type === 'subProcess' && el.elements && el.elements.length > 0) {
      total += 1 + measureDiagramColumns(el.elements);
    } else {
      total += 1;
    }
  }
  return total;
}

export interface DiagramQualityOptions {
  archetype?: string;
  tiersCount?: number;
  hasVariants?: boolean;
}

/**
 * Canonical lane order per Diagram_Quality_Checklist_v1.1 Rule 2.
 * Keywords that identify each lane position (case-insensitive partial match).
 */
const CANONICAL_LANE_KEYWORDS: Array<{ position: number; label: string; keywords: string[] }> = [
  { position: 1, label: 'Originator / Reporter / Caller Service', keywords: ['reporter', 'requester', 'originator', 'caller', 'citizen', 'applicant', 'submitter', 'requestor'] },
  { position: 2, label: 'System',                                  keywords: ['system'] },
  { position: 3, label: 'Front-line / Analyst',                   keywords: ['analyst', 'front', 'service desk', 'operator', 'officer'] },
  { position: 4, label: 'Approver / Lead',                        keywords: ['approver', 'lead', 'senior', 'manager', 'supervisor', 'ic'] },
  { position: 5, label: 'Specialist',                             keywords: ['specialist', 'support', 'engineer', 'sme', 'legal', 'risk', 'security'] },
  { position: 6, label: 'Governance',                             keywords: ['governance', 'compliance', 'audit', 'ciso', 'dpo'] },
];

function matchesLaneKeywords(name: string, keywords: string[]): boolean {
  const lower = name.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

export function getExpectedLaneOrder(archetype?: string): string {
  if (archetype === 'Capability') {
    return 'Caller Service → System → Front-line Analyst → Approver → Specialist';
  }
  return 'Originator / Reporter → System → Front-line Analyst → Approver → Specialist → Governance';
}

export function validateDiagramQualityRules(
  diagram: { participants?: Participant[]; elements: QEl[] },
  options: DiagramQualityOptions = {},
): QualityRuleResult[] {
  const lanes = diagram.participants ?? [];
  const all = collectAll(diagram.elements);
  const tasks = all.filter(e => TASK_TYPES.has(e.type));
  const labeled = all.filter(e => !!e.label);
  const shapeCount = countShapes(diagram.elements);

  const results: QualityRuleResult[] = [];

  // ── Rule 1 — Lane names ≤ 18 characters ──────────────────────────────────────
  const longLanes = lanes.filter(p => p.name.length > 18);
  results.push({
    rule: 1,
    name: 'Lane names ≤ 18 characters',
    status: lanes.length === 0 ? 'na' : longLanes.length === 0 ? 'pass' : 'fail',
    detail: longLanes.length > 0
      ? `Violations: ${longLanes.map(p => `"${p.name}" (${p.name.length})`).join(', ')}`
      : lanes.length === 0
        ? 'No lanes defined'
        : `All ${lanes.length} lane name(s) ≤ 18 chars`,
  });

  // ── Rule 2 — Lane order by handoff frequency ──────────────────────────────────
  // Fail if participants missing entirely; check canonical position keywords
  if (lanes.length === 0) {
    results.push({
      rule: 2,
      name: 'Lane order by handoff frequency',
      status: 'fail',
      detail: 'participants array is missing — workflowDiagram must declare lane names. Expected: ' + getExpectedLaneOrder(options.archetype),
    });
  } else {
    const issues: string[] = [];
    // Lane 1 must NOT be System
    if (matchesLaneKeywords(lanes[0]?.name ?? '', ['system'])) {
      issues.push(`Lane 1 is "System" — Lane 1 must be the flow originator (Reporter/Requester/Caller Service)`);
    }
    // System must be Lane 2 (index 1)
    const systemIdx = lanes.findIndex(p => matchesLaneKeywords(p.name, ['system']));
    if (systemIdx === -1) {
      issues.push(`No System lane found — Lane 2 must be named "System"`);
    } else if (systemIdx !== 1) {
      issues.push(`System lane is at position ${systemIdx + 1}, expected position 2`);
    }
    // Lane 1 for Capability must be "Caller Service"
    if (options.archetype === 'Capability') {
      if (!matchesLaneKeywords(lanes[0]?.name ?? '', ['caller'])) {
        issues.push(`Capability archetype: Lane 1 must be "Caller Service", got "${lanes[0]?.name}"`);
      }
    }
    results.push({
      rule: 2,
      name: 'Lane order by handoff frequency',
      status: issues.length === 0 ? 'pass' : 'fail',
      detail: issues.length === 0
        ? `Order: ${lanes.map(p => p.name).join(' → ')}`
        : issues.join('; '),
    });
  }

  // ── Rule 3 — Shape labels ≤ 30 characters ─────────────────────────────────────
  const longLabels = labeled.filter(e => (e.label?.length ?? 0) > 30);
  results.push({
    rule: 3,
    name: 'Shape labels ≤ 30 characters',
    status: longLabels.length === 0 ? 'pass' : 'fail',
    detail: longLabels.length > 0
      ? `${longLabels.length} label(s) too long: ${longLabels.slice(0, 3).map(e => `"${e.label}" (${e.label!.length})`).join('; ')}`
      : `All ${labeled.length} label(s) ≤ 30 chars`,
  });

  // ── Rule 4 — Time units: m / h / d only ──────────────────────────────────────
  const badTime = labeled.filter(e => /\d+\s*(minutes?|hours?|days?|business\s*days?)/i.test(e.label ?? ''));
  results.push({
    rule: 4,
    name: 'Time units: m / h / d only',
    status: badTime.length === 0 ? 'pass' : 'fail',
    detail: badTime.length > 0
      ? `Spell-out time units in: ${badTime.slice(0, 2).map(e => `"${e.label}"`).join(', ')} — use m/h/d`
      : 'All time values use abbreviated units',
  });

  // ── Rule 5 — Consistent shape types (no generic "task") ───────────────────────
  const genericTasks = all.filter(e => e.type === 'task');
  results.push({
    rule: 5,
    name: 'No generic "task" type — use userTask / serviceTask',
    status: genericTasks.length === 0 ? 'pass' : 'fail',
    detail: genericTasks.length > 0
      ? `${genericTasks.length} generic task(s): ${genericTasks.slice(0, 3).map(e => e.id).join(', ')} — specify userTask, serviceTask, or scriptTask`
      : 'All task elements use specific types',
  });

  // ── Rule 6 — Id numbering with insertion gaps ─────────────────────────────────
  // N/A: BPMN format uses string taskIds (T01, T02…), not Lucidchart numeric IDs
  results.push({
    rule: 6,
    name: 'Id numbering with insertion gaps',
    status: 'na',
    detail: 'N/A — BPMN JSON uses taskId strings (T01, T02…); Lucidchart numeric IDs not applicable',
  });

  // ── Rule 7 — Shape count limits (archetype-aware) ────────────────────────────
  const isCapability = options.archetype === 'Capability';
  let r7Status: QualityRuleStatus;
  let r7Detail: string;
  if (isCapability) {
    if (shapeCount < 8) {
      r7Status = 'fail';
      r7Detail = `${shapeCount} shapes — Capability minimum is 8. Add missing skeleton stages.`;
    } else if (shapeCount > 18) {
      r7Status = 'fail';
      r7Detail = `${shapeCount} shapes exceeds Capability limit of 18. Compress or re-run decomposition smell tests (may be a Composite).`;
    } else {
      r7Status = 'pass';
      r7Detail = `${shapeCount} shapes — within Capability range (8–18) ✓`;
    }
  } else {
    r7Status = shapeCount <= 25 ? 'pass' : 'fail';
    r7Detail = `${shapeCount} shapes total${shapeCount > 25 ? ' — compress (Rule 11) or split pages (Rule 10)' : ''}`;
  }
  results.push({
    rule: 7,
    name: isCapability ? 'Shape count 8–18 (Capability range)' : 'Maximum 25 shapes per page',
    status: r7Status,
    detail: r7Detail,
  });

  // ── Rule 8 — Loop-backs ≤ 4 columns ──────────────────────────────────────────
  // Cannot be computed from JSON alone — verified after BPMN layout render
  results.push({
    rule: 8,
    name: 'Loop-backs ≤ 4 columns',
    status: 'advisory',
    detail: 'Verified after layout render — loopGovernance entries in §16 bound re-entry task distance',
  });

  // ── Rule 9 — No self-loops ────────────────────────────────────────────────────
  // Structurally impossible in the tree element format
  results.push({
    rule: 9,
    name: 'No self-loops',
    status: 'pass',
    detail: 'Tree element structure prevents self-loops by construction',
  });

  // ── Rule 10 — Multi-page structure for variants ───────────────────────────────
  const isOrchestrating = options.archetype === 'Orchestrating';
  const hasTiers = (options.tiersCount ?? 0) > 1;
  const hasVariants = options.hasVariants ?? false;
  let r10Status: QualityRuleStatus;
  let r10Detail: string;
  if (isOrchestrating && hasTiers) {
    if (hasVariants) {
      r10Status = 'pass';
      r10Detail = `workflowVariants present — ${options.tiersCount} tier diagram(s) rendered in separate tabs ✓`;
    } else {
      r10Status = 'fail';
      r10Detail = `Orchestrating with ${options.tiersCount} severity tiers but no workflowVariants — add one diagram per tier`;
    }
  } else {
    r10Status = 'na';
    r10Detail = 'Single variant or Capability — one diagram page sufficient';
  }
  results.push({ rule: 10, name: 'Multi-page structure for variants', status: r10Status, detail: r10Detail });

  // ── Rule 11 — Compress repeated patterns ─────────────────────────────────────
  const advisory11 = tasks.length > 18;
  results.push({
    rule: 11,
    name: 'Compress repeated patterns',
    status: advisory11 ? 'advisory' : 'pass',
    detail: advisory11
      ? `${tasks.length} task elements — look for 2–3 step sequences that compress to a single labelled shape`
      : `${tasks.length} task(s) — within the recommended range`,
  });

  // ── Rule 12 — OLA values as compact [Nm/h/d] suffix only ─────────────────────
  const multiTierOla = labeled.filter(e => /\[\s*\w+\s+\d+[mhd]\s*\//.test(e.label ?? ''));
  results.push({
    rule: 12,
    name: 'OLA values as compact [Nm/h/d] suffix only',
    status: multiTierOla.length > 0 ? 'fail' : 'pass',
    detail: multiTierOla.length > 0
      ? `${multiTierOla.length} label(s) with multi-tier OLA — use one page per variant instead: ${multiTierOla.slice(0, 2).map(e => `"${e.label}"`).join(', ')}`
      : 'OLA values use single-value compact format',
  });

  // ── Rule 18 — Diagram width ≤ 20 columns (≤ 16 for Capability) ──────────────
  const colCount = measureDiagramColumns(diagram.elements);
  const widthLimit = isCapability ? 16 : 20;
  const softLimit = isCapability ? 20 : 25;
  let r18Status: QualityRuleStatus;
  let r18Detail: string;
  if (colCount <= widthLimit) {
    r18Status = 'pass';
    r18Detail = `${colCount} columns — within target (≤${widthLimit}) ✓`;
  } else if (colCount <= softLimit) {
    r18Status = 'advisory';
    r18Detail = `${colCount} columns — exceeds target of ${widthLimit}. Consider compressing 2–3 step modules into single shapes (Rule 11).`;
  } else {
    r18Status = 'fail';
    r18Detail = `${colCount} columns exceeds limit of ${softLimit}. Compress repeated patterns: collapse sequential tasks within the same module into a single labelled shape.`;
  }
  results.push({
    rule: 18,
    name: isCapability ? 'Diagram width ≤ 16 columns (Capability)' : 'Diagram width ≤ 20 columns',
    status: r18Status,
    detail: r18Detail,
  });

  // ── Capability Skeleton Rules (SK-1 to SK-5, only when archetype = Capability) ─
  if (isCapability) {
    const startEvents = all.filter(e => e.type === 'startEvent');
    const endEvents = all.filter(e => e.type === 'endEvent');
    const gateways = all.filter(e => GATEWAY_TYPES.has(e.type));

    // SK-1 (Rule 13): Lane 1 must be "Caller Service"
    const lane1Name = lanes[0]?.name ?? '';
    const lane1IsCallerService = matchesLaneKeywords(lane1Name, ['caller']);
    results.push({
      rule: 13,
      name: 'SK-1 Lane 1 = "Caller Service"',
      status: lane1IsCallerService ? 'pass' : 'fail',
      detail: lane1IsCallerService
        ? `Lane 1 is "${lane1Name}" ✓`
        : `Lane 1 is "${lane1Name || 'undefined'}" — Capability Lane 1 must be "Caller Service"`,
    });

    // SK-2 (Rule 14): Start event label = "Start (Service Call In)"
    const startHasCallIn = startEvents.some(e => /service call in|call in/i.test(e.label ?? ''));
    results.push({
      rule: 14,
      name: 'SK-2 Start event = "Start (Service Call In)"',
      status: startHasCallIn ? 'pass' : 'advisory',
      detail: startHasCallIn
        ? `Start event label marks call boundary ✓`
        : `Start event label should be "Start (Service Call In)" — marks the caller service boundary`,
    });

    // SK-3 (Rule 15): End event label contains "Complete"
    const endHasComplete = endEvents.some(e => /complete/i.test(e.label ?? ''));
    results.push({
      rule: 15,
      name: 'SK-3 End event = "End — {XXX} Complete"',
      status: endHasComplete ? 'pass' : 'advisory',
      detail: endHasComplete
        ? `End event label includes "Complete" ✓`
        : `End event label should include "Complete" (e.g. "End — Validation Complete") — returns control to caller`,
    });

    // SK-4 (Rule 16): Stage 6 — Decide — at least one gateway
    results.push({
      rule: 16,
      name: 'SK-4 Stage 6 (Decide) — gateway present',
      status: gateways.length > 0 ? 'pass' : 'fail',
      detail: gateways.length > 0
        ? `${gateways.length} decision gateway(s) found ✓`
        : `No gateway — Capability must have a Decide stage (exclusiveGateway) for outcome determination`,
    });

    // SK-5 (Rule 17): System lane tasks — Acknowledge + Archive
    const systemLikeTasks = tasks.filter(t =>
      t.colorKey === 'system' ||
      /receive|acknowledge|sla timer|timer start|issue.*outcome|communicate|archive/i.test(t.label ?? ''),
    );
    results.push({
      rule: 17,
      name: 'SK-5 System lane — Acknowledge & Archive tasks',
      status: systemLikeTasks.length >= 2 ? 'pass' : 'advisory',
      detail: systemLikeTasks.length >= 2
        ? `${systemLikeTasks.length} System-lane task(s) identified ✓`
        : `Expected ≥2 System tasks: Receive Request [M1], SLA Timer Start, Issue Outcome [M5], Archive Record`,
    });
  }

  return results;
}

/** Rules that trigger a generation retry when failing.
 *  Rules 13, 16 are Capability skeleton checks (SK-1, SK-4).
 *  Rule 10 enforces multi-page variants for Orchestrating services.
 *  Rule 18 enforces diagram width ≤20 columns (≤16 for Capability). */
export const HARD_FAIL_RULES = new Set([2, 3, 4, 5, 7, 10, 13, 16, 18]);

export function getHardFailErrors(results: QualityRuleResult[]): string[] {
  return results
    .filter(r => r.status === 'fail' && HARD_FAIL_RULES.has(r.rule))
    .map(r => `Rule ${r.rule} — ${r.name}: ${r.detail}`);
}

import { describe, it, expect } from 'vitest';
import {
  Stage0Schema, Stage1Schema, Stage2Schema, Stage3Schema,
} from '../schemas/manifest.schema';

// ─── extractJson helper (mirrors route.ts) ─────────────────────────────────────

function extractJson(raw: string): string {
  let s = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) s = s.slice(start, end + 1);
  return s;
}

function parseAndUnwrap(raw: string, outputKey: string) {
  const jsonStr = extractJson(raw);
  const parsed = JSON.parse(jsonStr);
  return (parsed[outputKey] !== undefined && typeof parsed[outputKey] === 'object')
    ? parsed[outputKey]
    : parsed;
}

// ─── extractJson unit tests ────────────────────────────────────────────────────

describe('extractJson', () => {
  it('returns clean JSON when no preamble', () => {
    const input = '{"a":1}';
    expect(extractJson(input)).toBe('{"a":1}');
  });

  it('strips markdown code fence', () => {
    const input = '```json\n{"a":1}\n```';
    expect(JSON.parse(extractJson(input))).toEqual({ a: 1 });
  });

  it('strips preamble text before first {', () => {
    const input = 'Looking at the requirements, here is the JSON:\n{"a":1}';
    expect(JSON.parse(extractJson(input))).toEqual({ a: 1 });
  });

  it('strips postamble text after last }', () => {
    const input = '{"a":1}\nLet me know if you need changes.';
    expect(JSON.parse(extractJson(input))).toEqual({ a: 1 });
  });
});

// ─── parseAndUnwrap unit tests ─────────────────────────────────────────────────

describe('parseAndUnwrap', () => {
  it('uses inner object when model wraps in outputKey', () => {
    const raw = '{"stage1":{"decompositionDecision":"x"}}';
    const result = parseAndUnwrap(raw, 'stage1');
    expect(result).toEqual({ decompositionDecision: 'x' });
  });

  it('uses object directly when not wrapped', () => {
    const raw = '{"decompositionDecision":"x"}';
    const result = parseAndUnwrap(raw, 'stage1');
    expect(result).toEqual({ decompositionDecision: 'x' });
  });
});

// ─── Stage 0 schema validation ─────────────────────────────────────────────────

const validStage0 = {
  serviceIdentification: {
    serviceCode: 'DGE-CY-001',
    nameEn: 'Cybersecurity Incident Response',
    nameAr: 'الاستجابة لحوادث الأمن السيبراني',
    category: 'business',
    owningEntity: 'Abu Dhabi DGE — Information Security Operations',
    boundary: { inScope: ['Critical incident handling'], outOfScope: ['Physical security'] },
    trigger: 'Security portal submission or SIEM alert',
    outcome: 'Incident resolved, PIR completed, case archived',
  },
  customerJourneyContext: {
    journeyPhase: 'Incident',
    touchpoints: ['Security portal', 'Service desk'],
    painPoints: ['Slow acknowledgement'],
  },
  capabilityReuseSearch: [
    { searchTerm: 'incident triage', matchFound: false, decision: 'new', rationale: 'No existing capability' },
    { searchTerm: 'case management', matchFound: true, matchName: 'ITSM', decision: 'fork', rationale: 'Needs security extensions' },
    { searchTerm: 'notification', matchFound: true, matchName: 'Notify SVC', decision: 'consume', rationale: 'Reuse notification service' },
  ],
  demandProfile: {
    annualVolume: 150,
    volumeBasis: 'Historical incident reports 2024',
    peakPeriods: ['Q4', 'Ramadan'],
    channels: ['online', 'call-center'],
    capacityBaseline: '3 Cyber Analysts',
  },
  dataInventory: [
    { dataElement: 'Incident Report', creates: true, reads: true, updates: true, deletes: false, classification: 'Confidential', retentionDays: 1825 },
  ],
  stakeholderMap: [
    { role: 'CISO', type: 'approver', responsibilities: ['Policy sign-off'], organization: 'DGE' },
  ],
};

describe('Stage0Schema', () => {
  it('validates a correct Stage 0 object', () => {
    expect(() => Stage0Schema.parse(validStage0)).not.toThrow();
  });

  it('rejects missing serviceCode', () => {
    const bad = { ...validStage0, serviceIdentification: { ...validStage0.serviceIdentification, serviceCode: undefined } };
    expect(() => Stage0Schema.parse(bad)).toThrow();
  });
});

// ─── Stage 1 schema validation ─────────────────────────────────────────────────

const validStage1 = {
  decompositionDecision: {
    archetype: 'Capability',
    smellTests: [
      { test: 'Single responsibility', result: 'pass', notes: 'Handles one incident lifecycle' },
      { test: 'Clear boundary', result: 'pass', notes: 'Starts at report, ends at PIR' },
      { test: 'Reusable', result: 'n/a', notes: 'Specialised security service' },
      { test: 'Independent deployable', result: 'pass', notes: 'No runtime dependencies on other services' },
      { test: 'Manageable size', result: 'pass', notes: 'Fits within a single team ownership' },
      { test: 'Aligned to lifecycle', result: 'pass', notes: 'Follows incident lifecycle stages' },
      { test: 'Observable', result: 'pass', notes: 'All steps emit audit events' },
    ],
    rationale: 'Single end-to-end incident response capability.',
    calledServices: [],
    decisionLog: [{ date: '2026-01-15', decision: 'Classified as Capability archetype', reviewer: 'CISO' }],
  },
  serviceBoundary: {
    inputs: [{ name: 'Incident Report', format: 'JSON', source: 'Security Portal' }],
    outputs: [{ name: 'Closure Certificate', format: 'PDF', destination: 'Reporter' }],
    calledServices: [],
  },
  valueStream: [
    { phase: 1, name: 'Report', customerActivity: 'Submit incident', serviceActivity: 'Acknowledge receipt' },
    { phase: 2, name: 'Triage', customerActivity: 'Await classification', serviceActivity: 'Classify and assign' },
    { phase: 3, name: 'Contain', customerActivity: 'Support investigation', serviceActivity: 'Execute containment' },
    { phase: 4, name: 'Recover', customerActivity: 'Verify restoration', serviceActivity: 'Eradicate and recover' },
    { phase: 5, name: 'Close', customerActivity: 'Receive closure notification', serviceActivity: 'Document and archive' },
  ],
  outcomeTargets: {
    statedSlaDays: 1,
    computedSlaDays: 1,
    variance: 0,
    olaBreakdown: [
      { service: 'Initial Triage', olaDays: 0.04, executionMode: 'Sequential' },
      { service: 'Containment', olaDays: 0.17, executionMode: 'Sequential' },
      { service: 'Recovery', olaDays: 0.5, executionMode: 'Sequential' },
    ],
  },
  auditDrivers: [
    { controlStep: 'Evidence Collection', regulation: 'NCA ECC-1:2018', evidenceRequired: 'Chain of custody log', retentionDays: 1825 },
    { controlStep: 'Breach Notification', regulation: 'NESA UAE IA Standards', evidenceRequired: 'Notification record', retentionDays: 1825 },
  ],
  lifecycleStage: {
    stage: 'Operating',
    annualReviewDate: '2027-01-15',
  },
};

describe('Stage1Schema', () => {
  it('validates a correct Stage 1 object', () => {
    expect(() => Stage1Schema.parse(validStage1)).not.toThrow();
  });

  it('rejects smellTests with wrong field names (name instead of test)', () => {
    const bad = {
      ...validStage1,
      decompositionDecision: {
        ...validStage1.decompositionDecision,
        smellTests: [
          { name: 'Single responsibility', result: 'pass', note: 'ok' }, // wrong field names
        ],
      },
    };
    expect(() => Stage1Schema.parse(bad)).toThrow();
  });

  it('rejects missing calledServices in decompositionDecision', () => {
    const bad = {
      ...validStage1,
      decompositionDecision: { ...validStage1.decompositionDecision, calledServices: undefined },
    };
    expect(() => Stage1Schema.parse(bad)).toThrow();
  });

  it('rejects missing decisionLog', () => {
    const bad = {
      ...validStage1,
      decompositionDecision: { ...validStage1.decompositionDecision, decisionLog: undefined },
    };
    expect(() => Stage1Schema.parse(bad)).toThrow();
  });

  it('rejects auditDrivers missing retentionDays', () => {
    const bad = {
      ...validStage1,
      auditDrivers: [{ controlStep: 'x', regulation: 'y', evidenceRequired: 'z' }], // missing retentionDays
    };
    expect(() => Stage1Schema.parse(bad)).toThrow();
  });

  it('rejects valueStream missing customerActivity', () => {
    const bad = {
      ...validStage1,
      valueStream: [{ phase: 1, name: 'Report', activity: 'Submit' }], // wrong field names
    };
    expect(() => Stage1Schema.parse(bad)).toThrow();
  });

  it('rejects auditDrivers with evidenceRequired as array (model common mistake)', () => {
    const bad = {
      ...validStage1,
      auditDrivers: [
        { controlStep: 'Evidence', regulation: 'NCA', evidenceRequired: ['doc1', 'doc2'], retentionDays: 365 },
      ],
    };
    expect(() => Stage1Schema.parse(bad)).toThrow();
  });

  it('rejects smellTests using "name" instead of "test" (model common mistake)', () => {
    const bad = {
      ...validStage1,
      decompositionDecision: {
        ...validStage1.decompositionDecision,
        smellTests: [
          { name: 'Single responsibility', result: 'pass', notes: 'ok' },
          { name: 'Clear boundary', result: 'pass', notes: 'ok' },
          { name: 'Reusable', result: 'n/a', notes: 'ok' },
        ],
      },
    };
    expect(() => Stage1Schema.parse(bad)).toThrow();
  });

  it('rejects valueStream using customerJourney instead of customerActivity (model common mistake)', () => {
    const bad = {
      ...validStage1,
      valueStream: [
        { phase: 1, name: 'Report', customerJourney: 'Submit incident', serviceResponse: 'Acknowledge' },
        { phase: 2, name: 'Triage', customerJourney: 'Wait', serviceResponse: 'Classify' },
        { phase: 3, name: 'Close', customerJourney: 'Receive closure', serviceResponse: 'Archive' },
      ],
    };
    expect(() => Stage1Schema.parse(bad)).toThrow();
  });
});

// ─── Stage 2 schema validation ─────────────────────────────────────────────────

const validStage2 = {
  moduleRegister: [
    { moduleId: 'MOD-01', name: 'Intake', description: 'Incident intake and triage', ola: '1h', alignedSubflow: 'Intake SVC', subflowMaturity: 'Stable' },
  ],
  taskRegister: [
    { taskId: 'T01', moduleId: 'MOD-01', name: 'Submit Incident', description: 'Reporter submits report', taskTypeCode: 'USR', digitizationMode: 'automated', olaFull: '15 minutes', olaCompact: '15m', capacityAssumption: '150/year', exceptionPath: 'Resubmit', automationCandidate: true, lane: 'Reporter' },
  ],
  loopGovernance: [],
  workflowDiagram: {
    id: 'Process_CYB',
    name: 'Cybersecurity Incident Response',
    elements: [
      { type: 'startEvent', id: 'start1', label: 'Incident Reported', colorKey: 'happy' },
      { type: 'task', id: 'task1', label: 'Triage Incident', colorKey: 'manual' },
      { type: 'endEvent', id: 'end1', label: 'Incident Closed', colorKey: 'happy' },
    ],
  },
  subflowAlignment: [
    { moduleId: 'MOD-01', pattern: 'Sequential Intake', wcpCode: 'WCP-01' },
  ],
};

describe('Stage2Schema', () => {
  it('validates a correct Stage 2 object', () => {
    expect(() => Stage2Schema.parse(validStage2)).not.toThrow();
  });

  it('accepts happy_end and decision as valid colorKeys', () => {
    const withNewColors = {
      ...validStage2,
      workflowDiagram: {
        ...validStage2.workflowDiagram,
        elements: [
          { type: 'startEvent', id: 'start1', label: 'Start', colorKey: 'happy' },
          { type: 'task', id: 'task1', label: 'Do Task', colorKey: 'system' },
          { type: 'endEvent', id: 'end1', label: 'End', colorKey: 'happy_end' },
        ],
      },
    };
    expect(() => Stage2Schema.parse(withNewColors)).not.toThrow();
  });

  it('rejects taskRegister missing olaFull/olaCompact', () => {
    const bad = {
      ...validStage2,
      taskRegister: [{ taskId: 'T01', moduleId: 'MOD-01', name: 'x', description: 'y', taskTypeCode: 'USR', digitizationMode: 'manual', capacityAssumption: 'z', exceptionPath: 'w', automationCandidate: false, lane: 'A' }],
    };
    expect(() => Stage2Schema.parse(bad)).toThrow();
  });
});

// ─── Stage 3 schema validation ─────────────────────────────────────────────────

const validStage3 = {
  buildHandoff: {
    dataContracts: [
      { name: 'Incident Payload', direction: 'Inbound', schemaDescription: 'JSON incident object', mandatoryFields: ['incidentId', 'severity'], optionalFields: ['attachments'], versioningStrategy: 'Semantic versioning v1.x' },
    ],
    integrationPoints: [
      { system: 'SIEM', direction: 'Inbound', protocol: 'REST', frequency: 'Real-time', authentication: 'API Key', fallbackBehavior: 'Queue alert for manual review' },
    ],
    automationCandidates: [
      { taskId: 'T01', automationMode: 'Full automation', buildApproach: 'RPA + API', prerequisites: ['SIEM API access'], phase: 'Phase 1' },
    ],
  },
  kpiInheritance: [
    { name: 'MTTR', definition: 'Mean time to resolve critical incidents', sourceTasks: ['T01'], parentKpi: 'Service Availability', frequency: 'Monthly', baseline: '4h', target: '2h' },
  ],
  operatingModel: {
    raci: [
      { activity: 'Incident Triage', responsible: 'Cyber Analyst', accountable: 'Cyber Lead', consulted: 'IT Support', informed: 'CISO' },
    ],
    cadence: [
      { forum: 'Security Review', frequency: 'Weekly', attendees: 'Cyber Lead, CISO', purpose: 'Review open incidents' },
    ],
  },
  acceptanceCriteria: [
    { criterion: 'Critical incidents acknowledged in 15 min', testApproach: 'Load test with 10 concurrent critical alerts', passThreshold: '95% within SLA', testOwner: 'QA Team' },
  ],
  risksOpenQuestions: [
    { item: 'SIEM integration API availability', type: 'Risk', owner: 'IT Support', resolutionDate: '2026-06-01', notes: 'Vendor confirmation pending' },
  ],
};

describe('Stage3Schema', () => {
  it('validates a correct Stage 3 object', () => {
    expect(() => Stage3Schema.parse(validStage3)).not.toThrow();
  });

  it('rejects kpiInheritance missing baseline', () => {
    const bad = {
      ...validStage3,
      kpiInheritance: [{ name: 'MTTR', definition: 'x', sourceTasks: ['T01'], frequency: 'Monthly', target: '2h' }],
    };
    expect(() => Stage3Schema.parse(bad)).toThrow();
  });
});

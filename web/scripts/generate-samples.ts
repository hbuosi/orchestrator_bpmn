/**
 * Generates sample Stage 1, 2, 3 HTML files for visual review.
 * Run: bun run scripts/generate-samples.ts
 */

import { writeFileSync } from 'fs';
import { stage1ManifestTemplate } from '../lib/templates/stage1-manifest.html';
import { stage2ManifestTemplate } from '../lib/templates/stage2-manifest.html';
import { stage3ManifestTemplate } from '../lib/templates/stage3-manifest.html';
import { generateBpmnXml } from '../lib/generators/bpmn-xml.generator';
import { applyColors } from '../lib/generators/bpmn-colors';
import type { Stage1, Stage2, Stage3 } from '../lib/schemas/manifest.schema';

// ── Same logic as route.ts buildDiagramFromRegisters ─────────────────────────
type TaskReg = { taskId: string; name: string; olaCompact?: string; digitizationMode: string; lane?: string; moduleId: string };
function buildDiagramFromRegisters(
  tasks: TaskReg[],
  modules: Array<{ moduleId: string; name: string }>,
  processId: string,
  processName: string,
  archetype?: string,
): object {
  const seenLanes = new Set<string>();
  const rawLanes: string[] = [];
  for (const t of tasks) {
    const lane = t.lane?.trim();
    if (lane && !seenLanes.has(lane)) { seenLanes.add(lane); rawLanes.push(lane); }
  }
  let participants = rawLanes.map((name, i) => ({ id: `lane${i + 1}`, name: name.slice(0, 18) }));
  if (archetype === 'Capability') {
    if (participants.length > 0) participants[0] = { id: 'lane1', name: 'Caller Service' };
    else participants = [{ id: 'lane1', name: 'Caller Service' }];
  }
  const sysIdx = participants.findIndex(p => /system/i.test(p.name));
  if (sysIdx > 1) { const [s] = participants.splice(sysIdx, 1); participants.splice(1, 0, s); }

  const moduleOrder = modules.map(m => m.moduleId);
  const sorted = [...tasks].sort((a, b) => {
    const ai = moduleOrder.indexOf(a.moduleId), bi = moduleOrder.indexOf(b.moduleId);
    if (ai !== bi) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    return tasks.indexOf(a) - tasks.indexOf(b);
  });

  const elements: object[] = [];
  const startLabel = archetype === 'Capability' ? 'Start (Service Call In)' : 'Start';
  elements.push({ type: 'startEvent', id: 'start_1', label: startLabel, colorKey: 'happy' });
  for (const task of sorted.slice(0, 15)) {
    const isAuto = task.digitizationMode === 'automated';
    const ola = task.olaCompact ? ` [${task.olaCompact}]` : '';
    const maxName = 30 - ola.length;
    const name = task.name.length > maxName ? task.name.slice(0, maxName - 1) + '…' : task.name;
    elements.push({ type: isAuto ? 'serviceTask' : 'userTask', id: task.taskId, label: (name + ola).slice(0, 30), colorKey: isAuto ? 'system' : 'manual' });
  }
  const endLabel = archetype === 'Capability'
    ? `End — ${(modules[0]?.name ?? 'Service').slice(0, 18)} Complete`.slice(0, 30)
    : 'End — Completed';
  elements.push({ type: 'endEvent', id: 'end_1', label: endLabel, colorKey: 'happy_end' });
  return { id: processId, name: processName, ...(participants.length > 0 ? { participants } : {}), elements };
}

// ─── Sample Stage 1 ──────────────────────────────────────────────────────────

const stage1: Stage1 = {
  decompositionDecision: {
    archetype: 'Orchestrating',
    decisionDate: '2026-05-18',
    decisionMadeBy: 'Henrique Lopes (Service Designer) + CISO + Architecture Lead',
    rationale: 'The Cybersecurity Incident Response service routes work across 5+ specialist roles (Analyst, Cyber Lead, IT Support, Risk & Compliance, Governance) with severity-driven variants (Critical, High, Medium/Low, False Positive). No single role owns >30% of the work and the service calls multiple capabilities (triage, evidence collection, breach management, PIR). This makes it an Orchestrating service, not a Composite, because variants share <40% of steps across severity tiers.',
    smellTests: [
      { test: 'Single Trigger, Single Primary Outcome', result: 'pass', notes: 'Triggered by incident report (portal, SIEM, service desk). Single outcome: incident resolved and PIR completed.' },
      { test: 'Owned by one accountability boundary', result: 'pass', notes: 'Information Security Operations owns end-to-end. CISO is final accountable executive.' },
      { test: 'Composite/Orchestrator Has ≥2 Service Calls', result: 'pass', notes: 'Calls: Triage Capability, Evidence Collection, Breach Management, Notification Service, PIR Capability — 5 service calls confirmed.' },
      { test: 'Capability Has Zero Embedded Service Calls', result: 'n/a', notes: 'N/A — declared as Orchestrating, not Capability.' },
      { test: 'Independent Lifecycle', result: 'pass', notes: 'Can be released, governed, and deprecated independently of HR or Finance services.' },
      { test: 'Alternate Flows Share ≥40% of Steps', result: 'fail', notes: 'Critical variant shares only ~32% of steps with Medium/Low variant. Documented justification: severity tiers are governed by different regulatory obligations (NCA ECC vs internal SLA), requiring separate flow paths. Acceptable deviation.' },
      { test: 'No Single Role Owns >70% of Composite Work', result: 'pass', notes: 'Work distribution: Cyber Analyst 28%, IT Support 25%, Cyber Lead 20%, Risk & Compliance 15%, System 12%. No single role exceeds 30%.' },
    ],
    calledServices: ['CYB-TRI-001 Triage Capability', 'CYB-EVI-001 Evidence Collection', 'CYB-BRE-001 Breach Management', 'CMN-NTF-001 Notification Service', 'CYB-PIR-001 Post-Incident Review'],
    decisionLog: [
      { date: '2026-05-10', decision: 'Declared as Orchestrating — 5 service calls confirmed, severity variants fail Test 6 with documented justification.', reviewer: 'H. Lopes' },
      { date: '2026-05-15', decision: 'Architecture review completed. Archetype confirmed. SLA cascade reviewed and approved.', reviewer: 'Architecture Lead' },
    ],
  },
  serviceBoundary: {
    inputs: [
      { name: 'Incident Report', format: 'Web form / SIEM alert / Email', source: 'Reporter (employee, system, external party)' },
      { name: 'Asset Inventory', format: 'JSON API', source: 'CMDB — Configuration Management Database' },
      { name: 'Threat Intelligence Feed', format: 'STIX/TAXII', source: 'External Threat Intelligence Provider' },
    ],
    outputs: [
      { name: 'Incident Record', format: 'PDF + ITSM ticket', destination: 'Case Management System' },
      { name: 'Executive Brief (M-ALERT)', format: 'Email / SMS', destination: 'CISO + Senior Stakeholders' },
      { name: 'Post-Incident Review Report', format: 'PDF', destination: 'Governance Repository' },
      { name: 'CSAT Survey', format: 'Email link', destination: 'Reporter' },
    ],
    calledServices: [
      { service: 'CYB-TRI-001 Triage Capability', cascadePattern: 'Sequential', ola: '45m' },
      { service: 'CYB-EVI-001 Evidence Collection', cascadePattern: 'Sequential', ola: '2h' },
      { service: 'CYB-BRE-001 Breach Management', cascadePattern: 'Sequential', ola: '2h' },
      { service: 'CMN-NTF-001 Notification Service', cascadePattern: 'Parallel', ola: '15m' },
      { service: 'CYB-PIR-001 Post-Incident Review', cascadePattern: 'Sequential', ola: '8h' },
    ],
  },
  valueStream: [
    { phase: 1, name: 'Report & Acknowledge', customerActivity: 'Submits incident via portal or service desk', serviceActivity: 'System auto-acknowledges within 15 min and starts SLA timer' },
    { phase: 2, name: 'Triage & Classify', customerActivity: 'Provides additional context if requested', serviceActivity: 'Analyst triages, classifies severity, sends M2 acknowledgement' },
    { phase: 3, name: 'Declare & Mobilise', customerActivity: 'Informed of critical declaration', serviceActivity: 'Cyber Lead declares Critical, appoints IC, System sends Executive Brief' },
    { phase: 4, name: 'Investigate & Contain', customerActivity: 'Cooperates with evidence requests', serviceActivity: 'Analyst investigates; IT Support contains; Compliance evaluates breach obligation' },
    { phase: 5, name: 'Recover & Close', customerActivity: 'Confirms resolution acceptable', serviceActivity: 'IT Support recovers; Cyber Lead verifies; case closed with CSAT survey' },
    { phase: 6, name: 'Review & Improve', customerActivity: 'Receives PIR summary if applicable', serviceActivity: 'Cyber Lead conducts PIR within 10 business days; KB updated' },
  ],
  outcomeTargets: {
    statedSlaDays: 1,
    computedSlaDays: 1,
    variance: 0,
    olaBreakdown: [
      { service: 'CYB-TRI-001 Triage', olaDays: 0.05, executionMode: 'Sequential' },
      { service: 'CYB-EVI-001 Evidence Collection', olaDays: 0.25, executionMode: 'Sequential' },
      { service: 'CYB-BRE-001 Breach Management', olaDays: 0.25, executionMode: 'Sequential' },
      { service: 'CMN-NTF-001 Notifications', olaDays: 0.02, executionMode: 'Parallel' },
      { service: 'IT Support Containment & Recovery', olaDays: 0.5, executionMode: 'Sequential' },
    ],
  },
  auditDrivers: [
    { controlStep: 'Incident Report Acknowledgement', regulation: 'NCA ECC-1:2018 §3.2', evidenceRequired: 'System-generated receipt with timestamp and incident ID logged in ITSM', retentionDays: 1825 },
    { controlStep: 'Breach Declaration Decision', regulation: 'UAE Federal Law No. 45 of 2021 (PDL) Art. 14', evidenceRequired: 'Cyber Lead attestation with timestamp; breach/no-breach decision recorded with rationale', retentionDays: 2555 },
    { controlStep: 'Regulatory Notification (if breach)', regulation: 'NESA UAE IA Standards; PDL Art. 14', evidenceRequired: 'Notification letter to regulator with proof of delivery and timestamp', retentionDays: 2555 },
    { controlStep: 'Post-Incident Review Completion', regulation: 'NCA ECC-1:2018 §4.1; Internal ISMS Policy', evidenceRequired: 'Signed PIR report with action items and owner assignments', retentionDays: 1825 },
  ],
  lifecycleStage: {
    stage: 'Designing',
    annualReviewDate: '2027-05-18',
  },
};

// ─── Sample Stage 2 ──────────────────────────────────────────────────────────
// Registers defined first so buildDiagramFromRegisters can reference them

const s2Modules = [
  { moduleId: 'M-INT-01', name: 'Incident Intake',             description: 'Receives, validates, and acknowledges incident reports from all channels', ola: '30 minutes', alignedSubflow: 'SF-INT-001 Standard Intake Pattern',             subflowMaturity: 'Ratified'   as const },
  { moduleId: 'M-TRI-01', name: 'Triage & Classification',     description: 'Analyst performs initial assessment and classifies severity tier',            ola: '45 minutes', alignedSubflow: 'SF-TRI-001 Severity Classification Pattern', subflowMaturity: 'Stable'     as const },
  { moduleId: 'M-ESC-01', name: 'Escalation Gate',             description: 'Cyber Lead reviews classification; declares Critical or returns for re-triage', ola: '30 minutes', alignedSubflow: 'SF-APR-002 Approval Gate Pattern',           subflowMaturity: 'Ratified'   as const },
  { moduleId: 'M-INV-01', name: 'Investigation & Containment', description: 'Evidence collection, root cause analysis, and threat containment',             ola: '6 hours',    alignedSubflow: 'SF-INV-001 Investigation Pattern',             subflowMaturity: 'Provisional' as const },
  { moduleId: 'M-REC-01', name: 'Recovery & Closure',          description: 'System recovery, case documentation, closure notification, and CSAT',          ola: '4 hours',    alignedSubflow: 'SF-CLO-001 Case Closure Pattern',              subflowMaturity: 'Stable'     as const },
  { moduleId: 'M-PIR-01', name: 'Post-Incident Review',        description: 'PIR within 10 business days; KB update and lessons-learned publication',       ola: '8 hours',    alignedSubflow: 'SF-PIR-001 PIR Pattern',                       subflowMaturity: 'Candidate'  as const },
];

const s2Tasks = [
  { taskId: 'T01', moduleId: 'M-INT-01', name: 'Submit Incident Report',      description: 'Reporter submits incident via security portal, service desk, or SIEM auto-alert',                                                                      taskTypeCode: 'BT-INT',  digitizationMode: 'automated' as const, olaFull: '1 Minute',               olaCompact: '1m',  capacityAssumption: '≤150 incidents/year (avg 3/week)',                              exceptionPath: 'If portal unavailable: auto-failover to service desk; SIEM alerts always routed directly',           automationCandidate: true,  lane: 'Reporter' },
  { taskId: 'T02', moduleId: 'M-INT-01', name: 'Acknowledge & Log (M1)',       description: 'System auto-acknowledges receipt within 15 min, creates ITSM ticket, starts SLA clock',                                                                  taskTypeCode: 'BT-INT',  digitizationMode: 'automated' as const, olaFull: '15 Minutes',             olaCompact: '15m', capacityAssumption: '≤150 incidents/year',                                           exceptionPath: 'If ITSM unavailable: log to backup register; alert on-call engineer; SLA clock still starts',       automationCandidate: false, lane: 'System' },
  { taskId: 'T03', moduleId: 'M-TRI-01', name: 'Perform Initial Triage',       description: 'Analyst reviews incident details, collects initial data, assesses severity using classification matrix',                                                  taskTypeCode: 'BT-TRI',  digitizationMode: 'assisted'  as const, olaFull: '45 Minutes',             olaCompact: '45m', capacityAssumption: '≤150 incidents/year; 3 Cyber Analysts',                        exceptionPath: 'If analyst unavailable: auto-escalate to Cyber Lead; if classification unclear: default to Critical', automationCandidate: false, lane: 'Cyber Analyst' },
  { taskId: 'T04', moduleId: 'M-ESC-01', name: 'Review Classification',        description: 'Cyber Lead reviews analyst classification. Approves or returns for re-triage.',                                                                           taskTypeCode: 'BT-APR1', digitizationMode: 'manual'    as const, olaFull: '30 Minutes',             olaCompact: '30m', capacityAssumption: '≤50 Critical incidents/year requiring Lead review',            exceptionPath: 'If Cyber Lead unavailable: IC acts. Max 2 re-triage cycles before auto-escalation to CISO',         automationCandidate: false, lane: 'Cyber Lead / IC' },
  { taskId: 'T05', moduleId: 'M-INV-01', name: 'Collect Digital Evidence',     description: 'Analyst collects logs, forensic images, network captures, and memory dumps',                                                                              taskTypeCode: 'BT-INV',  digitizationMode: 'assisted'  as const, olaFull: '2 Hours',                olaCompact: '2h',  capacityAssumption: '≤50 Critical incidents/year',                                   exceptionPath: 'If evidence system unavailable: manual collection with chain-of-custody form; document in PIR',      automationCandidate: true,  lane: 'Cyber Analyst' },
  { taskId: 'T06', moduleId: 'M-INV-01', name: 'Execute Containment',          description: 'IT Support isolates affected systems, blocks malicious IPs, resets compromised credentials',                                                               taskTypeCode: 'BT-ACT',  digitizationMode: 'assisted'  as const, olaFull: '4 Hours',                olaCompact: '4h',  capacityAssumption: '≤50 Critical incidents/year; 2 IT Support engineers',           exceptionPath: 'If containment action fails: escalate to Cyber Lead; document in rework loop LOOP-01',               automationCandidate: true,  lane: 'IT Support' },
  { taskId: 'T07', moduleId: 'M-REC-01', name: 'Recover Systems',              description: 'IT Support restores affected systems from clean backups; verifies integrity',                                                                               taskTypeCode: 'BT-ACT',  digitizationMode: 'manual'    as const, olaFull: 'Variable (2–8h)',          olaCompact: 'Var', capacityAssumption: '≤50 Critical incidents/year',                                   exceptionPath: 'If backup unavailable: invoke DR procedure; document deviation; escalate to CISO',                   automationCandidate: false, lane: 'IT Support' },
  { taskId: 'T08', moduleId: 'M-REC-01', name: 'Document & Close Case',        description: 'Analyst documents findings, timeline, and resolution; sends M5 closure notification and CSAT',                                                             taskTypeCode: 'BT-CLO',  digitizationMode: 'assisted'  as const, olaFull: '4 Hours',                olaCompact: '4h',  capacityAssumption: '≤150 incidents/year',                                           exceptionPath: 'N/A — closure is always possible; incomplete documentation flagged for PIR follow-up',               automationCandidate: true,  lane: 'Cyber Analyst' },
  { taskId: 'T09', moduleId: 'M-PIR-01', name: 'Conduct Post-Incident Rev.',   description: 'Cyber Lead leads PIR session; updates KB; publishes lessons-learned and control improvements (M6)',                                                       taskTypeCode: 'BT-REV',  digitizationMode: 'manual'    as const, olaFull: '8 Hours (within 10d)',    olaCompact: '8h',  capacityAssumption: '≤50 Critical incidents/year require full PIR; Medium/Low get lightweight review', exceptionPath: 'If PIR not completed within 10 days: auto-escalate to CISO; document in risk log', automationCandidate: false, lane: 'Cyber Lead / IC' },
];

// Build diagrams from registers (same logic as route.ts deriveStage2Diagrams)
const s2Tiers = [
  { tier: 'Critical', statedSlaDays: 1, computedSlaDays: 1, variance: 0, olaBreakdown: [ { service: 'Intake + Triage', olaDays: 0.08, executionMode: 'Sequential' as const }, { service: 'Containment + Recovery', olaDays: 0.6, executionMode: 'Sequential' as const }, { service: 'Closure + PIR (partial)', olaDays: 0.32, executionMode: 'Sequential' as const } ] },
  { tier: 'High', statedSlaDays: 3, computedSlaDays: 2, variance: -1, varianceJustification: 'Computed SLA is 2 days; stated 3 days provides buffer for resource contention during concurrent incidents', olaBreakdown: [ { service: 'Intake + Triage', olaDays: 0.25, executionMode: 'Sequential' as const }, { service: 'Containment + Recovery', olaDays: 1.5, executionMode: 'Sequential' as const }, { service: 'Closure', olaDays: 0.25, executionMode: 'Sequential' as const } ] },
];

const s2PrimaryDiagram = buildDiagramFromRegisters(s2Tasks, s2Modules, 'Process_CYB_IR001', 'CYB-IR001 Incident Response') as Stage2['workflowDiagram'];
const s2Variants = s2Tiers.map(tier => ({
  tier: tier.tier,
  diagram: buildDiagramFromRegisters(
    s2Tasks, s2Modules,
    `Process_CYB_IR001_${tier.tier.replace(/[^a-zA-Z0-9]/g, '_')}`,
    `CYB-IR001 Incident Response — ${tier.tier}`,
  ) as Stage2['workflowDiagram'],
}));

const stage2: Stage2 = {
  moduleRegister: s2Modules,
  taskRegister:   s2Tasks,
  loopGovernance: [
    { loopId: 'LOOP-01', type: 'Rework',        reentryTaskId: 'T06', maxCycles: 2, timeout: '8h',  escalationPath: 'After 2 cycles or 8h: escalate to Cyber Lead; invoke DR procedure; document in PIR', clockPolicy: 'Continue', reasonCodes: ['CONTAINMENT_FAILED', 'SYSTEM_UNAVAILABLE', 'BACKUP_CORRUPT', 'SCOPE_EXPANDED'] },
    { loopId: 'LOOP-02', type: 'Rework',        reentryTaskId: 'T03', maxCycles: 2, timeout: '2h',  escalationPath: 'After 2 re-triage cycles: default classification to Critical; escalate to Cyber Lead immediately', clockPolicy: 'Continue', reasonCodes: ['CLASSIFICATION_UNCLEAR', 'NEW_EVIDENCE_RECEIVED', 'SEVERITY_CHANGED'] },
  ],
  workflowDiagram:  s2PrimaryDiagram,
  workflowVariants: s2Variants,
  subflowAlignment: [
    { moduleId: 'M-INT-01', pattern: 'SF-INT-001 Standard Intake Pattern',             wcpCode: 'WCP-01', deviation: '' },
    { moduleId: 'M-TRI-01', pattern: 'SF-TRI-001 Severity Classification Pattern',     wcpCode: 'WCP-06', deviation: '' },
    { moduleId: 'M-ESC-01', pattern: 'SF-APR-002 Approval Gate Pattern',               wcpCode: 'WCP-04', deviation: 'Re-triage loop capped at 2 cycles (standard is 3); justified by Critical SLA constraint' },
    { moduleId: 'M-INV-01', pattern: 'SF-INV-001 Investigation Pattern',               wcpCode: 'WCP-09', deviation: 'Provisional pattern — under review by Library Curator' },
    { moduleId: 'M-REC-01', pattern: 'SF-CLO-001 Case Closure Pattern',                wcpCode: 'WCP-11', deviation: '' },
    { moduleId: 'M-PIR-01', pattern: 'SF-PIR-001 PIR Pattern',                         wcpCode: 'WCP-14', deviation: 'Candidate pattern — proposed for ratification after this service goes live' },
  ],
  severityTierReconciliation: s2Tiers,
};

// ─── Sample Stage 3 ──────────────────────────────────────────────────────────

const stage3: Stage3 = {
  buildHandoff: {
    dataContracts: [
      {
        name: 'Incident Report Payload',
        direction: 'Inbound',
        schemaDescription: '{ "incidentId": "string (auto)", "reportedBy": "string (mandatory)", "channel": "enum: portal|siem|service-desk (mandatory)", "summary": "string (mandatory, min 20 chars)", "affectedAssets": "array of asset IDs (mandatory ≥1)", "severity": "enum: critical|high|medium|low (optional — set by triage)", "timestamp": "ISO8601 (mandatory)" }',
        mandatoryFields: ['reportedBy', 'channel', 'summary', 'affectedAssets', 'timestamp'],
        optionalFields: ['severity', 'attachments', 'externalRef'],
        versioningStrategy: 'Semantic versioning; backwards-compatible additions only for v1.x; breaking changes increment major version with 90-day deprecation notice',
        schemaReference: 'https://schema.dge.gov.ae/cyb-ir/incident-report/v1.0',
        notes: 'SIEM-generated alerts auto-populate from alert payload. Manual reports require portal form validation.',
      },
      {
        name: 'Incident Closure Record',
        direction: 'Outbound',
        schemaDescription: '{ "incidentId": "string", "status": "closed", "resolution": "string", "rootCause": "string", "closedBy": "string", "closedAt": "ISO8601", "csatSent": "boolean", "pirRequired": "boolean" }',
        mandatoryFields: ['incidentId', 'status', 'resolution', 'rootCause', 'closedBy', 'closedAt'],
        optionalFields: ['csatSent', 'pirRequired', 'lessonLearned'],
        versioningStrategy: 'Same as Incident Report Payload — shared schema registry',
        notes: 'Written to Case Management System and archived to governance repository.',
      },
    ],
    integrationPoints: [
      {
        system: 'ITSM Platform (ServiceNow)',
        direction: 'Bidirectional',
        protocol: 'REST API (JSON)',
        frequency: 'Per-event (real-time)',
        authentication: 'OAuth 2.0 with service account; token rotation every 90 days',
        fallbackBehavior: 'If ITSM unavailable: write to backup SQLite log on app server; sync on reconnection within 15 min. Alert on-call engineer via PagerDuty.',
        rateLimits: '500 requests/minute per service account',
        slaDependency: 'M1 (15-min acknowledgement) depends on ITSM write success. SLA clock paused if ITSM unavailable >5 min.',
      },
      {
        system: 'Threat Intelligence Feed (TAXII Server)',
        direction: 'Inbound',
        protocol: 'TAXII 2.1 over HTTPS',
        frequency: 'Scheduled pull every 4 hours + on-demand during investigation',
        authentication: 'API key in header; rotated monthly',
        fallbackBehavior: 'Proceed without external TI; analyst uses internal KB. Document TI unavailability in incident record.',
        slaDependency: 'Non-blocking — investigation can proceed without TI feed',
      },
      {
        system: 'CMDB (Asset Registry)',
        direction: 'Inbound',
        protocol: 'REST API (JSON)',
        frequency: 'Per-request during triage',
        authentication: 'Mutual TLS with client certificate',
        fallbackBehavior: 'Use last-known asset snapshot (max 24h old). Flag incident record for manual asset verification.',
        rateLimits: '200 requests/minute',
        slaDependency: 'Triage OLA (45 min) assumes CMDB response <2s p95',
      },
    ],
    automationCandidates: [
      {
        taskId: 'T01',
        automationMode: 'Automated',
        buildApproach: 'Portal web form with API gateway + SIEM webhook integration. Auto-create ITSM ticket via ServiceNow REST API.',
        prerequisites: ['ServiceNow API credentials provisioned', 'SIEM webhook endpoint deployed', 'Portal authentication via UAE Pass integrated'],
        phase: 'Phase 1',
        estimatedEffort: '15 days',
      },
      {
        taskId: 'T02',
        automationMode: 'Automated',
        buildApproach: 'Event-driven trigger on ticket creation. System sets status, starts SLA clock, sends M1 acknowledgement email via Notification Service.',
        prerequisites: ['CMN-NTF-001 Notification Service live', 'SLA clock engine integrated with ITSM'],
        phase: 'Phase 1',
        estimatedEffort: '8 days',
      },
      {
        taskId: 'T05',
        automationMode: 'Assisted',
        buildApproach: 'Analyst-initiated evidence collection wizard with pre-built playbooks for common incident types. Auto-pull logs from SIEM and EDR.',
        prerequisites: ['SIEM API access configured', 'EDR platform API credentials', 'Evidence storage S3 bucket provisioned with encryption'],
        phase: 'Phase 2',
        estimatedEffort: '22 days',
      },
    ],
  },
  kpiInheritance: [
    {
      name: 'M1 Acknowledgement Rate',
      definition: 'Percentage of incidents acknowledged within 15 minutes / Total incidents received',
      sourceTasks: ['T01', 'T02'],
      parentKpi: 'Information Security Operations SLA Compliance Score',
      frequency: 'Daily',
      baseline: '94%',
      target: '99%',
    },
    {
      name: 'Critical Incident Resolution Rate',
      definition: 'Percentage of Critical incidents resolved within 24h / Total Critical incidents',
      sourceTasks: ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08'],
      parentKpi: 'NCA ECC Compliance Score',
      childKpi: 'CYB-TRI-001 Triage SLA Rate',
      frequency: 'Weekly',
      baseline: '87%',
      target: '95%',
    },
    {
      name: 'PIR Completion Rate',
      definition: 'Percentage of Critical incidents with PIR completed within 10 business days / Total Critical incidents',
      sourceTasks: ['T09'],
      parentKpi: 'Information Security Operations SLA Compliance Score',
      frequency: 'Monthly',
      baseline: '78%',
      target: '100%',
    },
    {
      name: 'Mean Time to Contain (MTTC)',
      definition: 'Average hours from incident declaration to containment confirmation / Total Critical incidents',
      sourceTasks: ['T03', 'T04', 'T05', 'T06'],
      parentKpi: 'NCA ECC Compliance Score',
      frequency: 'Weekly',
      baseline: '6.2 hours',
      target: '≤4 hours',
    },
  ],
  operatingModel: {
    raci: [
      { activity: 'Incident Intake & Acknowledgement', responsible: 'System (automated)', accountable: 'Cyber Analyst on duty', consulted: 'Service Desk', informed: 'Reporter' },
      { activity: 'Severity Classification', responsible: 'Cyber Analyst', accountable: 'Cyber Lead / IC', consulted: 'Threat Intelligence', informed: 'CISO (Critical only)' },
      { activity: 'Containment & Recovery', responsible: 'IT Support', accountable: 'Cyber Lead / IC', consulted: 'Cyber Analyst', informed: 'Service Owner, CISO' },
      { activity: 'Breach Determination', responsible: 'Risk & Compliance', accountable: 'CISO', consulted: 'Legal, Cyber Lead', informed: 'DGE Executive, Regulator' },
      { activity: 'Case Closure & CSAT', responsible: 'Cyber Analyst', accountable: 'Cyber Lead / IC', consulted: 'IT Support', informed: 'Reporter, Service Owner' },
      { activity: 'Post-Incident Review', responsible: 'Cyber Lead / IC', accountable: 'CISO', consulted: 'All responders', informed: 'Governance Board' },
    ],
    cadence: [
      { forum: 'Daily Incident Standup', frequency: 'Daily (08:00)', attendees: 'Cyber Analyst lead, Cyber Lead, IT Support lead', purpose: 'Review open incidents, SLA status, blockers' },
      { forum: 'Weekly Security Operations Review', frequency: 'Weekly (Monday)', attendees: 'Service Owner, CISO, Cyber Lead, Risk & Compliance', purpose: 'KPI review, breach assessments, capacity, open PIRs' },
      { forum: 'Monthly PIR Review Board', frequency: 'Monthly', attendees: 'CISO, Architecture Lead, Service Owner, Governance', purpose: 'Review completed PIRs, approve KB updates, control improvements' },
      { forum: 'Annual Service Lifecycle Review', frequency: 'Annual (May)', attendees: 'Service Owner, Service Sponsor, Architecture Lead', purpose: 'Archetype review, SLA revision, investment decision' },
    ],
  },
  acceptanceCriteria: [
    { criterion: 'M1 Acknowledgement SLA met', testApproach: 'Load test with 50 concurrent incident submissions; measure time from submission to ITSM ticket creation and M1 email send', passThreshold: '≥99% of incidents acknowledged within 15 minutes under 50 concurrent load', testOwner: 'Quality Assurance Lead' },
    { criterion: 'Critical incident SLA met end-to-end', testApproach: 'End-to-end simulation of Critical incident pathway with test data; clock start to closure measured', passThreshold: '≥95% of simulated Critical incidents closed within 24h over 20 test runs', testOwner: 'Cyber Lead' },
    { criterion: 'ITSM failover operates correctly', testApproach: 'Boundary test: simulate ITSM outage for 10 minutes; verify backup log writes and sync on reconnection', passThreshold: '100% of incidents during outage logged to backup; 100% synced within 15 min of reconnection', testOwner: 'IT Support Lead' },
    { criterion: 'Breach decision audit trail complete', testApproach: 'Audit review of 10 randomly selected test incidents with breach decision; verify attestation, timestamp, rationale, and reviewer identity', passThreshold: '100% of breach decisions have complete audit trail with all required fields populated', testOwner: 'Risk & Compliance Lead' },
    { criterion: 'Portal accessible on all target channels', testApproach: 'Cross-browser and mobile testing on Chrome, Safari, Edge, iOS Safari, Android Chrome', passThreshold: 'Zero critical defects; all form fields functional; UAE Pass login completes within 30s', testOwner: 'Quality Assurance Lead' },
  ],
  serviceFamilyIndex: [
    {
      serviceId: 'CYB-IR001',
      serviceName: 'Cybersecurity Incident Response',
      archetype: 'Orchestrating',
      calls: ['CYB-TRI-001', 'CYB-EVI-001', 'CYB-BRE-001', 'CMN-NTF-001', 'CYB-PIR-001'],
      calledBy: [],
      slaTarget: '24h (Critical)',
      manifestReference: 'CYB-IR001_Manifest.docx',
    },
    {
      serviceId: 'CYB-TRI-001',
      serviceName: 'Triage Capability',
      archetype: 'Capability',
      calls: [],
      calledBy: ['CYB-IR001'],
      slaTarget: '45m',
      manifestReference: 'CYB-TRI-001_Manifest.docx',
    },
    {
      serviceId: 'CYB-BRE-001',
      serviceName: 'Breach Management',
      archetype: 'Capability',
      calls: [],
      calledBy: ['CYB-IR001'],
      slaTarget: '2h',
      manifestReference: 'CYB-BRE-001_Manifest.docx',
    },
  ],
  serviceDependencyManifest: [
    {
      caller: 'CYB-IR001',
      called: 'CYB-TRI-001',
      cascadePattern: 'Sequential',
      impactIfChanged: 'Triage OLA change directly impacts Critical 24h SLA; verify cascade arithmetic',
    },
    {
      caller: 'CYB-IR001',
      called: 'CYB-BRE-001',
      cascadePattern: 'Sequential',
      impactIfChanged: 'Breach Management OLA change impacts conditional path; re-validate §19 severity tier reconciliation',
    },
    {
      caller: 'CYB-IR001',
      called: 'CMN-NTF-001',
      cascadePattern: 'Parallel',
      impactIfChanged: 'Parallel — no SLA impact; milestone notifications may be delayed but do not block resolution',
    },
  ],
  risksOpenQuestions: [
    { item: 'SIEM webhook integration delivery date not confirmed by IT Infrastructure', type: 'Risk', owner: 'IT Infrastructure Manager', resolutionDate: '2026-06-15', notes: 'Blocks T01 automation (Phase 1). Manual workaround available but degrades M1 SLA.' },
    { item: 'UAE Pass integration for portal authentication — level 2 or level 3?', type: 'Decision needed', owner: 'CISO', resolutionDate: '2026-05-31', notes: 'Level 3 requires biometric; adds 30s to submission flow. Security team preference is Level 3 but Service Owner prefers Level 2 for UX.' },
    { item: 'Regulatory notification threshold under PDL — 72h or 48h for government entities?', type: 'Open question', owner: 'Risk & Compliance Lead', resolutionDate: '2026-06-01', notes: 'Legal review in progress. Affects §17 exception pathway for Breach Management module.' },
    { item: 'Evidence storage S3 bucket — DGE cloud or on-premise?', type: 'Decision needed', owner: 'Architecture Lead', resolutionDate: '2026-06-10', notes: 'Classification of forensic evidence as Confidential may require on-premise. Architecture review scheduled.' },
  ],
  appendixA: [
    { date: '2026-05-10', decision: 'Declared as Orchestrating — 5 service calls, severity variants fail Test 6 with justification', madeBy: 'H. Lopes (Service Designer)', rationale: 'Routes work across 5+ specialist roles with severity-driven variants. No single role owns >30% of work.', reviewer: 'Architecture Lead' },
    { date: '2026-05-15', decision: 'Archetype confirmed after peer review. SLA cascade reviewed and approved.', madeBy: 'Architecture Lead', rationale: 'All 7 smell tests applied. Test 6 failure documented and accepted due to regulatory separation.', reviewer: 'CISO' },
  ],
  appendixB: [
    { scenario: 'End-of-Year Peak', description: 'Annual audit cycle drives 3x normal incident volume in Q4', loadMultiplier: '3x (450/year)', expectedImpact: 'Triage queue elongates; M1 SLA at risk above 2.5x baseline', mitigationStrategy: 'Pre-position additional Cyber Analysts in Q4; trigger at 120 open incidents' },
    { scenario: 'Major Breach Event', description: 'Coordinated attack generates 20+ simultaneous Critical incidents', loadMultiplier: '20x concurrent', expectedImpact: 'All Critical SLAs breach; Incident Commander role activated; CISO direct involvement', mitigationStrategy: 'Invoke Major Incident Protocol; external CERT-UAE support requested; PIR within 5 days' },
    { scenario: 'SIEM False Positive Storm', description: 'SIEM misconfiguration generates 1000+ false alerts in 1 hour', loadMultiplier: '500x short burst', expectedImpact: 'T01 automation overwhelmed; service desk capacity exhausted', mitigationStrategy: 'SIEM rate-limiting at gateway; auto-correlation threshold; analyst override capability' },
  ],
  appendixC: [
    { regulation: 'NCA ECC-1:2018', citation: 'National Cybersecurity Authority — Essential Cybersecurity Controls', article: '§3.2 Incident Management', applicability: 'Mandatory for all UAE federal government entities. Governs T02 acknowledgement SLA (15 min) and PIR requirements.', controlSection: '§12 Audit Drivers' },
    { regulation: 'UAE Federal Law No. 45 of 2021', citation: 'Personal Data Protection Law (PDL)', article: 'Art. 14 — Data Breach Notification', applicability: 'Requires notification to UAE Data Office within 72h of confirmed personal data breach. Triggers Breach Management module.', controlSection: '§12 Audit Drivers' },
    { regulation: 'NESA UAE IA Standards', citation: 'National Electronic Security Authority — Information Assurance Standards', article: 'IA-6 Incident Response', applicability: 'Defines evidence handling, chain of custody, and forensic requirements for §17 exception pathways.', controlSection: '§12 Audit Drivers' },
    { regulation: 'ISO/IEC 27035-1:2023', citation: 'Information Security Incident Management — Principles', article: 'Clause 8 — Response', applicability: 'Voluntary standard adopted by DGE for PIR structure and lessons-learned documentation.', controlSection: '§21 Subflow Alignment' },
  ],
  appendixD: [
    { version: 'v0.1', date: '2026-05-10', changedBy: 'H. Lopes', description: 'Initial draft — Stage 0 and Stage 1 complete. Archetype declared as Orchestrating.' },
    { version: 'v0.2', date: '2026-05-15', changedBy: 'H. Lopes', description: 'Stage 2 added — Module Register, Task Register, Loop Governance, BPMN diagram.' },
    { version: 'v0.3', date: '2026-05-18', changedBy: 'H. Lopes', description: 'Stage 3 added — Data Contracts, KPI Inheritance, Operating Model, Acceptance Criteria. §28–29 added. Appendices A–D added.' },
    { version: 'v1.0', date: '2026-05-18', changedBy: 'Architecture Lead + CISO', description: 'Stage gate review passed. Manifest approved for build handoff. Version 1.0 released.' },
  ],
};

// ─── Generate HTML files ─────────────────────────────────────────────────────

async function main() {
  const serviceCode = 'CYB-IR001';
  const outDir = '/tmp/manifest-samples';

  // Ensure output directory exists
  const { mkdirSync } = await import('fs');
  mkdirSync(outDir, { recursive: true });

  // Stage 1
  const html1 = stage1ManifestTemplate(stage1, serviceCode);
  writeFileSync(`${outDir}/stage1.html`, html1);
  console.log(`✓ Stage 1 → ${outDir}/stage1.html`);

  // Stage 2 — needs BPMN XML
  const bpmnXml = await generateBpmnXml(stage2.workflowDiagram);
  const coloredXml = await applyColors(bpmnXml, stage2.workflowDiagram);
  const html2 = stage2ManifestTemplate(stage2, coloredXml, serviceCode, undefined);
  writeFileSync(`${outDir}/stage2.html`, html2);
  console.log(`✓ Stage 2 → ${outDir}/stage2.html`);

  // Stage 3
  const html3 = stage3ManifestTemplate(stage3, serviceCode);
  writeFileSync(`${outDir}/stage3.html`, html3);
  console.log(`✓ Stage 3 → ${outDir}/stage3.html`);

  console.log('\nOpening in browser...');
}

main().catch(console.error);

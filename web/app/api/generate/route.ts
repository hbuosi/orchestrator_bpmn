import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ServiceDefinitionSchema } from '@/lib/schemas/service-definition.schema';
import { ServiceManifestSchema, Stage0Schema, Stage1Schema, Stage2Schema, Stage3Schema } from '@/lib/schemas/manifest.schema';
import type { Stage0, Stage1, Stage2, Stage3, ServiceManifest } from '@/lib/schemas/manifest.schema';
import { generateBpmnXml } from '@/lib/generators/bpmn-xml.generator';
import { applyColors } from '@/lib/generators/bpmn-colors';
import { generateWorkflowCsv } from '@/lib/generators/workflow-csv.generator';
import { combinedViewerTemplate } from '@/lib/templates/combined-viewer.html';
import { stage0ManifestTemplate } from '@/lib/templates/stage0-manifest.html';
import { stage1ManifestTemplate } from '@/lib/templates/stage1-manifest.html';
import { stage2ManifestTemplate } from '@/lib/templates/stage2-manifest.html';
import { stage3ManifestTemplate } from '@/lib/templates/stage3-manifest.html';
import { completeManifestTemplate } from '@/lib/templates/complete-manifest.html';
import { parseExcelBuffer, parsedFileToText } from '@/lib/parsers/excel.parser';
import { validateBpmnElements } from '@/lib/validators/bpmn-structure.validator';
import { validateDiagramQualityRules, getHardFailErrors } from '@/lib/validators/diagram-quality.validator';
import {
  STAGE_0_FRAMEWORK_PROMPT,
  STAGE_1_FRAMEWORK_PROMPT,
  STAGE_2_FRAMEWORK_PROMPT,
  STAGE_3_FRAMEWORK_PROMPT,
} from '@/lib/prompts/stage-prompts';

export const maxDuration = 300;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL_PRIMARY = 'claude-sonnet-4-6'; // primary — fast
const MODEL_FALLBACK = 'claude-opus-4-7';  // fallback — most capable if Sonnet fails
const MAX_RETRIES = 4;

// ─── Existing Service Card + BPMN system prompt ────────────────────────────────

const SYSTEM_PROMPT_CARD = `You are a BPMN 2.0 process modeling expert and government digital service designer specializing in UAE/Abu Dhabi TAMM standards.

Generate a complete service definition JSON including both a serviceCard and bpmnProcess.

The serviceCard must follow UAE TDRA standards with all required fields.
The bpmnProcess must model the happy path first, with exception branches diverging from gateways.

BPMN color rules:
- colorKey "happy"  → startEvent and happy-path end event
- colorKey "system" → automated/API/service tasks
- colorKey "manual" → human/user tasks requiring interaction
- colorKey "error"  → exception handling tasks
- colorKey "cancel" → rejection/termination end events

═══════════════════════════════════════════════════
BPMN STRUCTURAL RULES — VIOLATIONS CAUSE BROKEN DIAGRAMS
═══════════════════════════════════════════════════

RULE 1 — EVERY gateway needs AT LEAST 2 branches:
  A gateway with only 1 branch is invalid — minimum is 2 branches.

RULE 2 — EVERY branch must terminate correctly:
  Each gateway branch.path MUST end with {type:"endEvent"} UNLESS it is the
  single happy-path continuation branch (the one branch that moves forward).
  ALL error / rejection / incomplete branches MUST end with an endEvent.

RULE 3 — At most ONE open branch per gateway:
  Each exclusiveGateway may have AT MOST ONE branch without endEvent (the happy-path).

RULE 4 — No empty branch paths:
  Every branch.path must contain AT LEAST ONE task before any nested gateway.

RULE 5 — Maximum 3 gateway nesting levels.

RULE 5 — Every element has a unique ID.

RULE 6 — Task labels are verb+object, 4 words max.

RULE 7 — Gateway labels are questions ending in "?".

RULE 8 — Branch conditions are 1–2 words max.

═══════════════════════════════════════════════════
SERVICE CARD CONSTRAINTS:
═══════════════════════════════════════════════════
- journeySteps: MAXIMUM 7 steps
- channels: only "online" | "app" | "call-center" | "in-person"
- targetSegment: only "citizen" | "resident" | "business" | "visitor"
- category: only "life-event" | "business" | "informational"
- transformationStage: only "paper" | "digital" | "smart" | "proactive"
- uaePassLevel: only 1, 2, or 3 (integer)

Output ONLY raw JSON (no markdown, no code blocks) exactly matching this structure:
{
  "version": "1.0",
  "serviceCard": {
    "serviceCode": "...", "nameEn": "...", "nameAr": "...",
    "category": "life-event|business|informational",
    "owningEntity": "...",
    "channels": ["online","app","in-person"],
    "targetSegment": ["citizen","resident","business","visitor"],
    "eligibilityCriteria": ["..."],
    "requiredDocuments": [{"name":"...","format":"...","notes":"..."}],
    "journeySteps": [{"step":1,"title":"...","description":"...","estimatedMinutes":5}],
    "fees": [{"channel":"online","applicantType":"...","amountAED":100}],
    "slaDays": {"online":3,"in-person":5},
    "legalBasis": "...",
    "transformationStage": "smart",
    "uaePassEnabled": true,
    "uaePassLevel": 2,
    "outputDocuments": [{"name":"...","format":"...","validityDays":365,"deliveryMethod":"..."}],
    "integrationApis": ["..."],
    "addaComplianceLevel": "Level 3 — Fully Integrated"
  },
  "bpmnProcess": {
    "id": "Process_...", "name": "...",
    "elements": [ ... ]
  },
  "generate": {"serviceCard":true,"bpmn":true,"pdf":true,"svg":true,"standaloneHtml":true}
}`;

// ─── Manifest system prompt (Modes A & B) ─────────────────────────────────────

const SYSTEM_PROMPT_MANIFEST = `You are a Business Service Design Framework v2.6 expert for Abu Dhabi DGE government services.

You generate Service Manifest JSON documents covering all 4 stages of the framework:
- Stage 0 (§1–7): Service Definition — identification, journey context, capability reuse, demand, data inventory, stakeholders
- Stage 1 (§8–13): Service Design — decomposition decision (archetype), boundary, value stream, SLA cascade, audit drivers, lifecycle
- Stage 2 (§14–22): Task Model & Workflow — module register, task register, loop governance, BPMN workflow, subflow alignment
- Stage 3 (§23–27): Build-Ready Requirements — data contracts, integrations, KPIs, RACI, acceptance criteria, risks

═══════════════════════════════════════════════════
STAGE 0 RULES (Service_Definition_Prompt_v3.0):
═══════════════════════════════════════════════════
- serviceCode: format "DGE-XX-NNN" (e.g. "DGE-BL-001")
- category: only "life-event" | "business" | "informational"
- demandProfile.channels: only "online" | "app" | "call-center" | "in-person"
- capabilityReuseSearch: MINIMUM 3 entries with explicit consume/fork/new decisions AND rationale — "don't know if anything exists" is not acceptable
- demandProfile.volumeBasis: MUST state source (e.g. "Historical incident reports 2024", "Comparable service benchmark") — never vague
- stakeholderMap: use named roles (not "TBD") — type: "reviewer" | "approver" | "escalation" | "informed" | "operator"
- boundary.inScope and boundary.outOfScope: must be specific, not vague ("all incidents" is not acceptable)

STAGE 0 COMMON MISTAKES TO AVOID:
- Fewer than 3 capability reuse searches — causes capability proliferation
- volumeBasis with no source — OLAs become unenforceable when volume changes
- stakeholderMap with generic placeholder roles — sign-off routing breaks at later stages

═══════════════════════════════════════════════════
STAGE 1 RULES — EXACT FIELD NAMES (Service_Design_Prompt_v3.0):
═══════════════════════════════════════════════════
decompositionDecision:
  archetype: "Capability" | "Composite" | "Orchestrating"
  smellTests[]: { "test": "...", "result": "pass"|"fail"|"n/a", "notes": "..." }
    ⚠ field is "test" NOT "name"/"description"; field is "notes" NOT "note"/"comment"
    ⚠ EXACTLY 7 entries required — one per smell test — Zod will REJECT fewer than 7
    The 7 smell tests ARE (use these exact names as the "test" value):
      1. "Single trigger and single primary outcome"
      2. "Owned by one accountability boundary"
      3. "If composite/orchestrator: ≥2 explicit service calls to capabilities"
      4. "If capability: zero embedded service calls"
      5. "Service can be released, tested, governed independently"
      6. "No alternate flow shares <40% of steps with main flow (otherwise split)"
      7. "No single role owns >70% of work in a composite (otherwise consider capability)"
    Result "n/a" is valid when the test does not apply to the declared archetype (e.g. tests 3–4 for a Capability).
  calledServices: [] (array of strings — REQUIRED, empty array if none)
  decisionLog[]: { "date": "YYYY-MM-DD", "decision": "...", "reviewer": "..." } (min 1 entry)

⚠ ARCHETYPE CONSISTENCY (most critical Stage 1 rule):
  - archetype = "Capability" → serviceBoundary.calledServices MUST be [] (empty) — capabilities call nothing
  - archetype = "Composite" or "Orchestrating" → serviceBoundary.calledServices MUST have ≥1 entry
  - Declaring "Composite" with zero calledServices = mis-archetype → should be Capability
  - Declaring "Capability" with calledServices entries = mis-archetype → should be Composite

serviceBoundary:
  inputs[]: { "name": "...", "format": "...", "source": "..." } (REQUIRED array, min 1)
  outputs[]: { "name": "...", "format": "...", "destination": "..." } (REQUIRED array, min 1)
  calledServices[]: { "service": "...", "cascadePattern": "Sequential"|"Parallel"|"Pre-existing", "ola": "..." }

valueStream[]: { "phase": 1, "name": "...", "customerActivity": "...", "serviceActivity": "..." }
  ⚠ field is "customerActivity" NOT "customerJourney"/"action"
  ⚠ field is "serviceActivity" NOT "serviceResponse"/"systemAction"
  ⚠ 3–5 phases ONLY — more than 7 means you are doing Stage 2 task decomposition (wrong stage)
  ⚠ phases are customer-visible journey stages, NOT internal task lists

outcomeTargets:
  variance = computedSlaDays - statedSlaDays (integer)
  olaBreakdown[]: { "service": "...", "olaDays": 1, "executionMode": "Sequential"|"Parallel" }
  ⚠ variance > 0 requires "varianceJustification" field explaining the gap

auditDrivers[]: { "controlStep": "...", "regulation": "...", "evidenceRequired": "...", "retentionDays": 365 }
  ⚠ field is "controlStep" NOT "step"/"name"
  ⚠ "evidenceRequired" is a STRING (specific, e.g. "Approver attestation with timestamp") NOT an array, NOT vague
  ⚠ field is "retentionDays" (number) NOT "retention"/"retentionPeriod"

lifecycleStage: { "stage": "Designing"|"Implementing"|"Operating"|"Retiring", "annualReviewDate": "YYYY-MM-DD" }
  ⚠ field is "annualReviewDate" NOT "reviewDate"/"nextReview"

STAGE 1 COMMON MISTAKES TO AVOID:
- Archetype mismatch with calledServices — see consistency rule above
- Stated SLA disagrees with computed SLA without varianceJustification
- Value stream with more than 7 phases — too granular, belongs in Stage 2
- evidenceRequired is vague ("approval recorded") — must be specific and auditable

═══════════════════════════════════════════════════
STAGE 2 RULES — EXACT FIELD NAMES (Task_Model_and_Workflow_Prompt_v3.0):
═══════════════════════════════════════════════════
- moduleId format: "MOD-01", "MOD-02", etc.
- taskId format: "T01", "T02", etc.
- taskTypeCode: short code like "USR", "SVC", "DEC", "INT", "NTF"
- digitizationMode: "automated" | "assisted" | "manual"
- subflowMaturity: "Candidate" | "Provisional" | "Ratified" | "Stable" | "Deprecated"

taskRegister[] — EVERY task MUST have:
  olaFull (full text e.g. "15 Minutes"), olaCompact (short e.g. "15m"), capacityAssumption (volume baseline), exceptionPath (specific behavior on failure or explicit "N/A — no exception path, reason: ...")
  ⚠ olaFull and olaCompact are BOTH required — do NOT omit either

loopGovernance[]: { "loopId":"LOOP-01", "type":"Rework", "reentryTaskId":"T01", "maxCycles":2, "timeout":"24h", "escalationPath":"...", "clockPolicy":"Stop", "reasonCodes":["..."] }
  ⚠ field is "reentryTaskId" NOT "taskId"/"reEntryTask"/"entryTask"
  ⚠ field is "maxCycles" (number) NOT "cycles"/"maxIterations"/"iterations"
  ⚠ field is "timeout" (string e.g. "24h") NOT "timeoutDuration"/"slaTimeout"
  ⚠ field is "escalationPath" NOT "escalation"/"escalateTo"
  ⚠ field is "reasonCodes" (array of strings) NOT "reasons"/"codes"
  ⚠ clockPolicy: "Stop" | "Continue" | "Mixed"
  ⚠ type: "Resubmission" | "Rework" | "Negotiation" | "Iteration"
  ⚠ Every loop-back in the workflowDiagram MUST have a corresponding loopGovernance entry — no ungoverned loops

workflowDiagram: { "id":"Process_1", "name":"...", "elements":[...] }
  ⚠ MUST include "id" (string) and "name" (string) — do NOT omit them

subflowAlignment[]: { "moduleId":"MOD-01", "pattern":"...", "wcpCode":"WCP-01", "deviation":"" }
  ⚠ field is "pattern" NOT "name"/"patternName"/"alignmentPattern"
  ⚠ wcpCode: WCP workflow control pattern code e.g. "WCP-01", "WCP-02"
  ⚠ EVERY module from moduleRegister MUST appear in subflowAlignment (same count)

STAGE 2 COMMON MISTAKES TO AVOID:
- Loops in workflowDiagram with no loopGovernance entry — ungoverned loops cause stuck cases in production
- Tasks missing olaFull or olaCompact — OLA becomes unenforceable
- Tasks missing capacityAssumption — OLA fails when volume changes
- moduleRegister modules not appearing in subflowAlignment — reuse rate degrades
- workflowDiagram missing id or name fields

BPMN STRUCTURAL RULES (workflowDiagram):
⚠ GATEWAY RULES — VIOLATIONS CAUSE VALIDATION FAILURE:
1. Every gateway MUST have AT LEAST 2 branches — a gateway with 1 branch is invalid
2. For EVERY exclusiveGateway, EXACTLY ONE branch may omit endEvent (the main flow continuation). ALL other branches MUST end with {"type":"endEvent",...}
3. Every branch.path MUST contain at least 1 task before any nested gateway
4. At most ONE open branch per gateway — NEVER 2 or more open branches

CORRECT example (note: 2 branches minimum):
{"type":"exclusiveGateway","id":"gw1","label":"Severity?","branches":[
  {"condition":"Critical","path":[{"type":"task","id":"t_esc","label":"Escalate Critical","colorKey":"error"},{"type":"endEvent","id":"end_crit","label":"End — Escalated","colorKey":"cancel"}]},
  {"condition":"Standard","path":[{"type":"task","id":"t_std","label":"Process Standard","colorKey":"manual"}]}
]}
The "Standard" branch has NO endEvent — it is the ONLY open branch. There are EXACTLY 2 branches.

- EVERY branch must terminate: each branch.path ends with {type:"endEvent"} UNLESS it is the single happy-path continuation
- At most ONE open branch per gateway (the happy-path) — NEVER 2 or more open branches
- No empty branch paths: every branch.path has at least one task
- Maximum 3 gateway nesting levels
- Every element has a unique ID
- colorKey "happy" → start/happy end, "system" → automated tasks, "manual" → human tasks, "error" → exceptions, "cancel" → rejection ends, "decision" → gateways

═══════════════════════════════════════════════════
STAGE 3 RULES (Build_Ready_Requirements_Prompt_v3.0):
═══════════════════════════════════════════════════
- dataContracts[].direction: "Inbound" | "Outbound"
- integrationPoints[].direction: "Outbound" | "Inbound" | "Bidirectional"
- kpiInheritance[].frequency: "Daily" | "Weekly" | "Monthly"
- automationCandidates[].phase: "Phase 1" | "Phase 2"
- risksOpenQuestions[].type: "Risk" | "Issue" | "Decision needed" | "Open question"
- buildHandoff.automationCandidates[].taskId must reference valid taskIds from stage2.taskRegister

dataContracts[]: every input/output crossing the service boundary needs a contract with mandatory and optional fields explicitly named — not vague
integrationPoints[]: MUST include authentication method and fallbackBehavior for every external system — missing auth detail blocks build teams
kpiInheritance[]: MUST include parentKpi linking to portfolio-level KPI — enables dashboard roll-up
acceptanceCriteria[]: each criterion MUST have a specific testable passThreshold (e.g. "95% within SLA", "< 2s response time") — vague thresholds fail at go-live

STAGE 3 COMMON MISTAKES TO AVOID:
- Acceptance criteria without testable passThreshold — go-live decision becomes subjective
- Integration points missing authentication or fallbackBehavior — build team blocks at first integration sprint
- KPIs with no parentKpi — portfolio dashboards cannot aggregate
- Restating Stage 0/1 content in data contracts — build team skips it; focus on what's NEW that build needs

═══════════════════════════════════════════════════
COMPACTNESS (stay within token budget):
═══════════════════════════════════════════════════
- capabilityReuseSearch: 3–4 entries
- valueStream: 4–5 phases
- moduleRegister: 3–5 modules
- taskRegister: 6–10 tasks
- loopGovernance: 0–2 loops
- dataContracts: 2–3 contracts
- integrationPoints: 2–4 systems
- kpiInheritance: 3–4 KPIs
- raci: 4–6 activities
- acceptanceCriteria: 4–6 criteria
- risksOpenQuestions: 3–5 items
- BPMN workflowDiagram: 15–25 elements`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COMPACT_HINTS =
  `COMPACTNESS (stay within token budget):\n` +
  `- journeySteps: max 5 steps\n` +
  `- requiredDocuments: max 4 items\n` +
  `- eligibilityCriteria: max 3 items\n` +
  `- integrationApis: max 3 items\n` +
  `- outputDocuments: max 2 items\n` +
  `- BPMN: max 12 elements total across all branches\n` +
  `- Task labels: 2–3 words only`;

// ─── BPMN fallback builders ───────────────────────────────────────────────────
// Used when the model cannot produce a structurally valid BPMN after all retries.
// Builds a simple linear (no gateways) diagram so the stage succeeds rather than failing.

function buildFallbackWorkflowDiagram(
  tasks: Array<{ taskId: string; name: string; digitizationMode: string }>,
  processId: string,
  processName: string,
): object {
  const elements: object[] = [
    { type: 'startEvent', id: 'start_1', label: 'Start', colorKey: 'happy' },
  ];
  tasks.slice(0, 15).forEach((task) => {
    elements.push({
      type: task.digitizationMode === 'automated' ? 'serviceTask' : 'userTask',
      id: task.taskId,
      label: task.name.slice(0, 30),
      colorKey: task.digitizationMode === 'automated' ? 'system' : 'manual',
    });
  });
  elements.push({ type: 'endEvent', id: 'end_1', label: 'End — Completed', colorKey: 'happy_end' });
  return { id: processId || 'Process_1', name: processName || 'Service Workflow', elements };
}

type DiagramElement = { type: string; id: string; branches?: Array<{ path: DiagramElement[] }>; elements?: DiagramElement[] };

function collectDiagramTaskIds(elements: DiagramElement[]): Set<string> {
  const taskTypes = new Set(['task', 'userTask', 'serviceTask', 'scriptTask']);
  const ids = new Set<string>();
  for (const el of elements) {
    if (taskTypes.has(el.type)) ids.add(el.id);
    if (el.branches) for (const b of el.branches) collectDiagramTaskIds(b.path).forEach(id => ids.add(id));
    if (el.elements) collectDiagramTaskIds(el.elements).forEach(id => ids.add(id));
  }
  return ids;
}

function validateRegisterCoverage(
  workflowElements: DiagramElement[],
  taskRegister: Array<{ taskId: string }>,
): string[] {
  const registeredIds = new Set(taskRegister.map(t => t.taskId));
  const diagramTaskIds = collectDiagramTaskIds(workflowElements);
  const errors: string[] = [];
  for (const id of diagramTaskIds) {
    if (!registeredIds.has(id)) {
      errors.push(`workflowDiagram task element id="${id}" is not in taskRegister — use a taskId from Section 15 (e.g. T01, T02)`);
    }
  }
  return errors;
}

function isJsonTruncationError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('position') || msg.includes('Unexpected end') || msg.includes('Unexpected token') || msg.includes("Expected ',' or");
}

// Strips markdown fences and any preamble/postamble text, returning just the JSON object.
function extractJson(raw: string): string {
  let s = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    s = s.slice(start, end + 1);
  }
  return s;
}

function send(controller: ReadableStreamDefaultController, encoder: TextEncoder, data: object) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

// ─── Generation: existing service card + BPMN ─────────────────────────────────

async function generateDefinitionWithRetry(
  text: string,
  onStatus: (msg: string) => void,
): Promise<ReturnType<typeof ServiceDefinitionSchema.parse>> {
  let lastError = '';
  let lastOutput = '';
  let lastWasTruncated = false;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const useOpus = attempt <= 2;
    const model: string = useOpus ? MODEL_PRIMARY : MODEL_FALLBACK;
    const maxTokens: number = useOpus ? 6000 : (lastWasTruncated ? 16000 : 8000);

    let userContent: string;
    if (attempt === 1) {
      userContent =
        `Generate a complete service definition for:\n\n${text}\n\n` +
        `IMPORTANT: Your response must start with "{" and end with "}". Do NOT write any explanation or preamble.\n\n` +
        `${COMPACT_HINTS}\n\n` +
        `Before outputting verify: (1) every error/rejection branch ends with endEvent, ` +
        `(2) each gateway has at most 1 open branch, (3) no branch path is empty.`;
    } else if (lastWasTruncated) {
      userContent =
        `Your previous output was INCOMPLETE (JSON cut off mid-string). ` +
        `Regenerate the COMPLETE service definition from scratch for:\n\n${text}\n\n` +
        `${COMPACT_HINTS}\n` +
        `Output ONLY raw JSON — no explanation, no markdown fences.`;
    } else if (lastError.startsWith('BPMN structural')) {
      userContent =
        `Your previous BPMN failed structural validation.\n\n` +
        `ERRORS:\n${lastError}\n\n` +
        `⚠ GATEWAY FIX:\n` +
        `1. Every gateway MUST have AT LEAST 2 branches.\n` +
        `2. EXACTLY ONE branch may omit endEvent (happy path).\n` +
        `3. ALL other branches MUST end with {"type":"endEvent","id":"...","label":"...","colorKey":"cancel"}.\n\n` +
        `PREVIOUS OUTPUT (fix ONLY the gateway branches):\n${lastOutput}\n\n` +
        `Return the full corrected JSON starting with "{".`;
    } else {
      userContent =
        `Your previous output failed validation. Fix ALL errors and return the COMPLETE corrected JSON.\n\n` +
        `ERRORS:\n${lastError}\n\n` +
        `PREVIOUS OUTPUT (return corrected in full):\n${lastOutput}\n\n` +
        `MANDATORY FIXES:\n` +
        `1. journeySteps: max 7 items\n` +
        `2. Every error/rejection branch MUST end with endEvent\n` +
        `3. Each gateway: at most 1 open (non-endEvent) branch\n` +
        `4. No empty branch paths\n` +
        `5. Branch conditions: 1–2 words\n` +
        `6. Nesting > 3 levels: FLATTEN`;
    }

    if (attempt === 1) onStatus('Calling Sonnet model...');
    else if (!useOpus) onStatus(`Retrying with Sonnet — attempt ${attempt} of ${MAX_RETRIES}...`);
    else onStatus(`Switching to Opus fallback — attempt ${attempt} of ${MAX_RETRIES}...`);

    let tick = 0;
    const heartbeat = setInterval(() => {
      tick++;
      onStatus(`Generating service definition${'.'.repeat((tick % 3) + 1)}`);
    }, 4000);

    let response: Anthropic.Message;
    try {
      response = await anthropic.messages.stream({
        model,
        max_tokens: maxTokens,
        system: [{ type: 'text', text: SYSTEM_PROMPT_CARD, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userContent }],
      }).finalMessage();
    } finally {
      clearInterval(heartbeat);
    }

    lastWasTruncated = response.stop_reason === 'max_tokens';
    lastOutput = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('');
    const jsonStr = extractJson(lastOutput);

    try {
      const parsed = JSON.parse(jsonStr);
      const validated = ServiceDefinitionSchema.parse(parsed);
      const structuralErrors = validateBpmnElements(validated.bpmnProcess.elements);
      if (structuralErrors.length > 0) {
        lastError = `BPMN structural errors:\n${structuralErrors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
        if (attempt === MAX_RETRIES) {
          // Fallback: replace with a simple linear BPMN so generation succeeds
          const fallbackProcess = buildFallbackWorkflowDiagram(
            validated.serviceCard.journeySteps.map((s, i) => ({
              taskId: `step_${i}`,
              name: s.title,
              digitizationMode: 'manual',
            })),
            'Process_1',
            validated.serviceCard.nameEn,
          );
          const patched = { ...validated, bpmnProcess: fallbackProcess };
          return ServiceDefinitionSchema.parse(patched);
        }
        continue;
      }
      return validated;
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('BPMN structural')) throw err;
      lastError = err instanceof Error ? err.message : String(err);
      lastWasTruncated = lastWasTruncated || isJsonTruncationError(err);
      if (attempt === MAX_RETRIES) throw new Error(`Generation failed after ${MAX_RETRIES} attempts. Last error: ${lastError}`);
    }
  }
  throw new Error('unreachable');
}

// ─── Generation: full manifest (Mode A — single pass) ─────────────────────────

async function generateManifestWithRetry(
  text: string,
  onStatus: (msg: string) => void,
): Promise<ServiceManifest> {
  let lastError = '';
  let lastOutput = '';
  let lastWasTruncated = false;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const useOpus = attempt <= 2;
    const model: string = useOpus ? MODEL_PRIMARY : MODEL_FALLBACK;
    // Single-pass fits all 4 stages without workflowCsvSpec — 12k is sufficient for Opus.
    const maxTokens: number = useOpus ? 12000 : (lastWasTruncated ? 20000 : 16000);

    let userContent: string;
    if (attempt === 1) {
      userContent =
        `Generate a complete Service Manifest v2.6 for the following government service:\n\n${text}\n\n` +
        `IMPORTANT: Your response must start with "{" and end with "}". Do NOT write any explanation or preamble.\n` +
        `Keep every array to 3–5 entries maximum. Omit "workflowCsvSpec" from stage2 (not needed here).\n` +
        `Output ONLY raw JSON (no markdown, no code blocks) matching the ServiceManifest structure:\n` +
        `{\n` +
        `  "version": "2.6",\n` +
        `  "stage0": { "serviceIdentification": {...}, "customerJourneyContext": {...}, "capabilityReuseSearch": [...], "demandProfile": {...}, "dataInventory": [...], "stakeholderMap": [...] },\n` +
        `  "stage1": { "decompositionDecision": {...}, "serviceBoundary": {...}, "valueStream": [...], "outcomeTargets": {...}, "auditDrivers": [...], "lifecycleStage": {...} },\n` +
        `  "stage2": { "moduleRegister": [...], "taskRegister": [...], "loopGovernance": [...], "workflowDiagram": {"id":"...","name":"...","elements":[...]}, "subflowAlignment": [...] },\n` +
        `  "stage3": { "buildHandoff": { "dataContracts": [...], "integrationPoints": [...], "automationCandidates": [...] }, "kpiInheritance": [...], "operatingModel": {"raci":[...],"cadence":[...]}, "acceptanceCriteria": [...], "risksOpenQuestions": [...] }\n` +
        `}`;
    } else if (lastWasTruncated) {
      userContent =
        `Your previous output was INCOMPLETE (JSON cut off). ` +
        `Regenerate the COMPLETE ServiceManifest v2.6 from scratch for:\n\n${text}\n\n` +
        `Output ONLY raw JSON. Be more concise — use minimum required entries per array.`;
    } else {
      userContent =
        `Your previous output failed validation. Fix ALL errors and return the COMPLETE corrected JSON.\n\n` +
        `ERRORS:\n${lastError}\n\n` +
        `PREVIOUS OUTPUT:\n${lastOutput.slice(0, 4000)}...\n\n` +
        `Return the full corrected ServiceManifest v2.6 JSON.`;
    }

    if (attempt === 1) onStatus('Generating Service Manifest with Sonnet...');
    else if (!useOpus) onStatus(`Retrying manifest with Sonnet — attempt ${attempt} of ${MAX_RETRIES}...`);
    else onStatus(`Switching to Opus fallback — attempt ${attempt} of ${MAX_RETRIES}...`);

    let tick = 0;
    const heartbeat = setInterval(() => {
      tick++;
      onStatus(`Generating manifest${'.'.repeat((tick % 3) + 1)}`);
    }, 4000);

    let response: Anthropic.Message;
    try {
      response = await anthropic.messages.stream({
        model,
        max_tokens: maxTokens,
        system: [{ type: 'text', text: SYSTEM_PROMPT_MANIFEST, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userContent }],
      }).finalMessage();
    } finally {
      clearInterval(heartbeat);
    }

    lastWasTruncated = response.stop_reason === 'max_tokens';
    lastOutput = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('');
    const jsonStr = extractJson(lastOutput);

    try {
      const parsed = JSON.parse(jsonStr);
      const validated = ServiceManifestSchema.parse(parsed);
      const structuralErrors = validateBpmnElements(validated.stage2.workflowDiagram.elements);
      if (structuralErrors.length > 0) {
        lastError = `BPMN structural errors in stage2.workflowDiagram:\n${structuralErrors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
        if (attempt === MAX_RETRIES) {
          // Fallback: replace with a simple linear BPMN built from the task register
          const fallbackDiagram = buildFallbackWorkflowDiagram(
            validated.stage2.taskRegister,
            validated.stage2.workflowDiagram.id,
            validated.stage2.workflowDiagram.name,
          );
          const patched = {
            ...validated,
            stage2: { ...validated.stage2, workflowDiagram: fallbackDiagram },
          };
          return ServiceManifestSchema.parse(patched);
        }
        continue;
      }
      const coverageErrors = validateRegisterCoverage(
        validated.stage2.workflowDiagram.elements as DiagramElement[],
        validated.stage2.taskRegister,
      );
      if (coverageErrors.length > 0) {
        lastError = `Register coverage errors in stage2.workflowDiagram:\n${coverageErrors.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\n⚠ Every task/userTask/serviceTask element id must exactly match a taskId from taskRegister (T01, T02, ...).`;
        if (attempt === MAX_RETRIES) {
          const fallbackDiagram = buildFallbackWorkflowDiagram(
            validated.stage2.taskRegister,
            validated.stage2.workflowDiagram.id,
            validated.stage2.workflowDiagram.name,
          );
          const patched = {
            ...validated,
            stage2: { ...validated.stage2, workflowDiagram: fallbackDiagram },
          };
          return ServiceManifestSchema.parse(patched);
        }
        continue;
      }
      // Quality rule check (hard-fail rules only — R2, R3, R4, R5, R7, R10)
      const qualityResults = validateDiagramQualityRules(
        validated.stage2.workflowDiagram as Parameters<typeof validateDiagramQualityRules>[0],
        {
          tiersCount: validated.stage2.severityTierReconciliation?.length ?? 0,
          hasVariants: (validated.stage2.workflowVariants?.length ?? 0) > 0,
        },
      );
      const qualityHardFails = getHardFailErrors(qualityResults);
      if (qualityHardFails.length > 0) {
        lastError = `Diagram quality rule violations:\n${qualityHardFails.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
        if (attempt === MAX_RETRIES) return validated; // accept with violations on last attempt
        continue;
      }
      return validated;
    } catch (err) {
      // Manifest BPMN errors are handled with fallback above — no rethrow needed
      lastError = err instanceof Error ? err.message : String(err);
      lastWasTruncated = lastWasTruncated || isJsonTruncationError(err);
      if (attempt === MAX_RETRIES) throw new Error(`Manifest generation failed after ${MAX_RETRIES} attempts. Last error: ${lastError}`);
    }
  }
  throw new Error('unreachable');
}

// ─── Generation: single stage (Mode B) ────────────────────────────────────────

async function generateStageWithRetry<T>(
  stageNum: 0 | 1 | 2 | 3,
  text: string,
  previousStages: { stage0?: Stage0; stage1?: Stage1; stage2?: Stage2 },
  onStatus: (msg: string) => void,
  corrections?: string,
): Promise<T> {
  const stageNames = ['Stage 0: Service Definition', 'Stage 1: Service Design', 'Stage 2: Task Model & Workflow', 'Stage 3: Build-Ready Requirements'];
  const stageSchemas = [Stage0Schema, Stage1Schema, Stage2Schema, Stage3Schema];
  const stageOutputKeys = ['stage0', 'stage1', 'stage2', 'stage3'];
  const stageFieldDescriptions = [
    // Stage 0 — exact field names required by Zod schema
    `{
  "serviceIdentification":{"serviceCode":"DGE-XX-001","nameEn":"...","nameAr":"...","domain":"Cybersecurity","category":"business","owningEntity":"...","serviceOwner":"[Name, Role]","serviceSponsor":"[Senior Exec Name]","customerType":"Internal employees / External vendors","servicePurpose":"[1-sentence business outcome]","boundary":{"inScope":["..."],"outOfScope":["..."]},"trigger":"...","outcome":"[End state when service succeeds]","outcomeRejection":"[End state when service rejects/exits early]"},
  "customerJourneyContext":{
    "journeyPhase":"...","touchpoints":["..."],"painPoints":["..."],
    "triggerEvent":"[What customer experience leads to this service being needed]",
    "touchpointChannel":"[How customer interacts: portal, email, in-person, etc.]",
    "customerMindset":"[What customer is trying to achieve, feeling, expecting]",
    "adjacentServices":"[Other services typically used before/after/alongside]",
    "customerEffortScore":"Easy",
    "journeyMapReference":"[Link to formal journey map if available]"
  },
  "capabilityReuseSearch":[{"searchTerm":"[Function Needed]","matchFound":false,"matchName":"","decision":"new","rationale":"..."}],
  "demandProfile":{
    "annualVolume":0,"volumeBasis":"...","peakPeriods":["..."],"channels":["online"],"capacityBaseline":"...",
    "dailyAverage":"[N/day]","peakDay":"[N/day during peak]",
    "channelMix":"[% portal / % email / % in-person / % API]",
    "customerSegments":"[Segments and rough proportions]",
    "capacityConstraints":"[Roles, systems, or resources that cap throughput]",
    "seasonalityVariability":"[Predictable spikes or troughs]"
  },
  "dataInventory":[{"dataElement":"...","creates":true,"reads":true,"updates":false,"deletes":false,"classification":"Confidential","retentionDays":365,"sourceSinkSystem":"[Source or Sink system name]","retention":"7 years"}],
  "stakeholderMap":[{"role":"...","type":"approver","responsibilities":["..."],"organization":"...","engagementLevel":"Per-request","decisionRights":"Approve/reject"}]
}`,
    // Stage 1 — exact field names required by Zod schema
    `{
  "decompositionDecision":{
    "archetype":"Capability",
    "decisionDate":"2026-01-01",
    "decisionMadeBy":"[Designer name + reviewers]",
    "smellTests":[
      {"test":"Single trigger and single primary outcome","result":"pass","notes":"..."},
      {"test":"Owned by one accountability boundary","result":"pass","notes":"..."},
      {"test":"If composite/orchestrator: ≥2 explicit service calls to capabilities","result":"n/a","notes":"Not applicable — declared as Capability"},
      {"test":"If capability: zero embedded service calls","result":"pass","notes":"..."},
      {"test":"Service can be released, tested, governed independently","result":"pass","notes":"..."},
      {"test":"No alternate flow shares <40% of steps with main flow (otherwise split)","result":"n/a","notes":"No variants in this service"},
      {"test":"No single role owns >70% of work in a composite (otherwise consider capability)","result":"n/a","notes":"Not applicable — declared as Capability"}
    ],
    "rationale":"...",
    "calledServices":[],
    "decisionLog":[{"decision":"Declared as [archetype]","date":"2026-01-01","madeBy":"[Designer + reviewers]","rationale":"[1 sentence]","reviewer":"[Reviewer name]"}]
  },
  "serviceBoundary":{
    "inputs":[{"name":"...","format":"...","source":"...","from":"[Source org/system]","frequency":"On-demand","validation":"Schema check"}],
    "outputs":[{"name":"...","format":"...","destination":"...","to":"[Recipient]","trigger":"On success","evidence":"[Milestone log]"}],
    "calledServices":[{"service":"[ID] [Name]","serviceId":"[ID]","serviceName":"[Name]","mode":"Sync","cascadePattern":"Sequential","ola":"..."}]
  },
  "valueStream":[{"phase":1,"name":"...","customerActivity":"...","serviceActivity":"...","stageOutcome":"[What is achieved]","stageTimeTarget":"Within Xh"}],
  "outcomeTargets":{
    "slaTargets":[{"tier":"Default","cycleTimeTarget":"Nd","qualityTarget":"≥X%","availabilityTarget":"Business hours"}],
    "statedSlaDays":1,"computedSlaDays":1,"variance":0,
    "varianceJustification":"...",
    "olaBreakdown":[{"service":"...","olaDays":1,"executionMode":"Sequential","contributionToSla":"+1d"}]
  },
  "auditDrivers":[{"controlStep":"...","regulation":"[Regulation / internal policy]","evidenceRequired":"...","retentionDays":365}],
  "lifecycleStage":{"stage":"Designing","targetGoLive":"2026-01-01","stableOperationDate":"2026-06-01","deprecationPlan":"N/A","annualReviewDate":"2027-01-01"}
}`,
    // Stage 2 — exact field names required by Zod schema
    // NOTE: if archetype = Capability, use Capability participants (Lane 1 = "Caller Service") and 9-stage skeleton
    `{
  "moduleRegister":[{"moduleId":"MOD-01","name":"...","description":"...","ola":"...","alignedSubflow":"...","subflowMaturity":"Stable"}],
  "taskRegister":[{
    "taskId":"T01","moduleId":"MOD-01","name":"...","description":"...","taskTypeCode":"USR",
    "digitizationMode":"manual","olaFull":"15 minutes","olaCompact":"15m",
    "capacityAssumption":"...","exceptionPath":"...","automationCandidate":false,"lane":"..."
  }],
  "loopGovernance":[{"loopId":"LOOP-01","type":"Rework","reentryTaskId":"T01","maxCycles":2,"timeout":"24h","escalationPath":"...","clockPolicy":"Stop","reasonCodes":["..."]}],
  "workflowDiagram":{"id":"Process_1","name":"...","participants":[
    {"id":"lane1","name":"Reporter"},
    {"id":"lane2","name":"System"},
    {"id":"lane3","name":"Analyst"},
    {"id":"lane4","name":"Approver"}
  ],"elements":[
    {"type":"startEvent","id":"start_1","label":"Start","colorKey":"happy"},
    {"type":"userTask","id":"T01","label":"Task Name [15m]","colorKey":"manual"},
    {"type":"serviceTask","id":"T02","label":"System Task [5m]","colorKey":"system"},
    {"type":"endEvent","id":"end_1","label":"End — Completed","colorKey":"happy_end"}
  ]},
  "subflowAlignment":[{"moduleId":"MOD-01","pattern":"...","wcpCode":"WCP-01","deviation":""}]
}
// Example for archetype = Capability (Lane 1 = "Caller Service", 9-stage skeleton):
// "participants":[{"id":"lane1","name":"Caller Service"},{"id":"lane2","name":"System"},{"id":"lane3","name":"Analyst"},{"id":"lane4","name":"Approver"}]
// "elements":[
//   {"type":"startEvent","id":"start_1","label":"Start (Service Call In)","colorKey":"happy"},
//   {"type":"serviceTask","id":"T01","label":"Receive {Name} Request [M1]","colorKey":"system"},
//   {"type":"serviceTask","id":"T02","label":"SLA Timer Start [{OLA}]","colorKey":"system"},
//   ...domain tasks T03–T07...,
//   {"type":"exclusiveGateway","id":"gw_1","label":"Outcome?","branches":[...]},
//   {"type":"serviceTask","id":"T08","label":"Issue {Name} Outcome [M5]","colorKey":"system"},
//   {"type":"serviceTask","id":"T09","label":"Archive {Name} Record","colorKey":"system"},
//   {"type":"endEvent","id":"end_1","label":"End — {Name} Complete","colorKey":"happy_end"}
// ]`,
    // Stage 3 — exact field names required by Zod schema
    `{
  "buildHandoff":{
    "dataContracts":[{"name":"...","direction":"Inbound","schemaDescription":"...","mandatoryFields":["..."],"optionalFields":["..."],"versioningStrategy":"..."}],
    "integrationPoints":[{"system":"...","direction":"Inbound","protocol":"REST","frequency":"Real-time","authentication":"API Key","fallbackBehavior":"..."}],
    "automationCandidates":[{"taskId":"T01","automationMode":"...","buildApproach":"...","prerequisites":["..."],"phase":"Phase 1"}]
  },
  "kpiInheritance":[{"name":"...","definition":"...","sourceTasks":["T01"],"parentKpi":"...","childKpi":"...","frequency":"Monthly","baseline":"...","target":"..."}],
  "operatingModel":{
    "raci":[{"activity":"...","responsible":"...","accountable":"...","consulted":"...","informed":"..."}],
    "cadence":[{"forum":"...","frequency":"Weekly","attendees":"...","purpose":"..."}]
  },
  "acceptanceCriteria":[{"criterion":"...","testApproach":"...","passThreshold":"...","testOwner":"..."}],
  "risksOpenQuestions":[{"item":"...","type":"Risk","owner":"...","resolutionDate":"2026-01-01","notes":"..."}]
}`,
  ];

  const stageFrameworkPrompts = [
    STAGE_0_FRAMEWORK_PROMPT,
    STAGE_1_FRAMEWORK_PROMPT,
    STAGE_2_FRAMEWORK_PROMPT,
    STAGE_3_FRAMEWORK_PROMPT,
  ];

  const schema = stageSchemas[stageNum]!;
  const outputKey = stageOutputKeys[stageNum]!;
  const stageName = stageNames[stageNum]!;
  const frameworkPrompt = stageFrameworkPrompts[stageNum]!;

  let contextSection = '';
  if (previousStages.stage0) contextSection += `\nSTAGE 0 CONTEXT:\n${JSON.stringify(previousStages.stage0, null, 0).slice(0, 3000)}\n`;
  if (previousStages.stage1) contextSection += `\nSTAGE 1 CONTEXT:\n${JSON.stringify(previousStages.stage1, null, 0).slice(0, 2000)}\n`;
  if (previousStages.stage2) contextSection += `\nSTAGE 2 CONTEXT:\n${JSON.stringify(previousStages.stage2, null, 0).slice(0, 2000)}\n`;

  let lastError = '';
  let lastOutput = '';
  let lastWasTruncated = false;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const useSonnet = attempt <= 3;
    const model: string = useSonnet ? MODEL_PRIMARY : MODEL_FALLBACK;
    const maxTokens: number = useSonnet
      ? (stageNum === 2 ? 6000 : stageNum <= 1 ? 5000 : 7000)
      : (lastWasTruncated ? 14000 : 10000);

    let userContent: string;
    if (attempt === 1) {
      const correctionPrefix = corrections
        ? `USER REVIEW CORRECTIONS — Please incorporate these corrections exactly in your output:\n\n${corrections}\n\n---\n\n`
        : '';
      userContent =
        correctionPrefix +
        `FRAMEWORK AUTHORING RULES (source of truth for this stage):\n${frameworkPrompt}\n\n` +
        `---\n\n` +
        `SERVICE DESCRIPTION:\n${text}${contextSection}\n\n` +
        `IMPORTANT: Apply the framework rules above to produce ONLY a raw JSON object. ` +
        `Your response must start with "{" and end with "}". Do NOT write any explanation or preamble.\n\n` +
        `Output the JSON for the "${outputKey}" field using THESE exact field names:\n${stageFieldDescriptions[stageNum]}`;
    } else if (lastWasTruncated) {
      userContent =
        `Your previous output was INCOMPLETE. Regenerate ${stageName} from scratch for:\n\n${text}${contextSection}\n\n` +
        `Use THESE exact field names (no other names are valid):\n${stageFieldDescriptions[stageNum]}\n\n` +
        `Start your response with "{" — no preamble. Be concise — minimum required entries.`;
    } else if (lastError.startsWith('BPMN structural errors')) {
      userContent =
        `Your previous ${stageName} workflowDiagram failed BPMN structural validation.\n\n` +
        `BPMN ERRORS TO FIX:\n${lastError}\n\n` +
        `⚠ GATEWAY RULES:\n` +
        `1. Every gateway MUST have AT LEAST 2 branches — 1 branch is invalid.\n` +
        `2. For EVERY exclusiveGateway, EXACTLY ONE branch may omit endEvent (the main flow continues after the gateway).\n` +
        `3. ALL other branches MUST end with {"type":"endEvent","id":"...","label":"...","colorKey":"cancel"}.\n\n` +
        `CORRECT pattern:\n` +
        `{"type":"exclusiveGateway","id":"gw1","label":"Decision?","branches":[\n` +
        `  {"condition":"Yes","path":[{"type":"task","id":"t1","label":"Handle Yes","colorKey":"error"},{"type":"endEvent","id":"end_yes","label":"End — Rejected","colorKey":"cancel"}]},\n` +
        `  {"condition":"No","path":[{"type":"task","id":"t2","label":"Continue Flow","colorKey":"manual"}]}\n` +
        `]}\n` +
        `The "No" branch has NO endEvent — it is the ONLY open branch allowed.\n\n` +
        `PREVIOUS OUTPUT (fix ONLY the gateway structure — all other fields are correct):\n${lastOutput.slice(0, 3000)}\n\n` +
        `Start your response with "{" — no preamble. Return the corrected "${outputKey}" JSON.`;
    } else {
      userContent =
        `Your previous output for ${stageName} failed validation.\n\n` +
        `VALIDATION ERRORS:\n${lastError}\n\n` +
        `REQUIRED STRUCTURE (use THESE exact field names — wrong names cause all the above errors):\n${stageFieldDescriptions[stageNum]}\n\n` +
        `PREVIOUS OUTPUT (rewrite it, fixing every field name to match the structure above):\n${lastOutput.slice(0, 3000)}\n\n` +
        `Start your response with "{" — no preamble. Return the corrected "${outputKey}" JSON.`;
    }

    if (attempt === 1) onStatus(corrections ? `Regenerating ${stageName} with corrections...` : `Generating ${stageName} with Sonnet...`);
    else if (useSonnet) onStatus(`Retrying ${stageName} with Sonnet — attempt ${attempt}...`);
    else onStatus(`Opus fallback — ${stageName} attempt ${attempt}...`);

    let tick = 0;
    const heartbeat = setInterval(() => {
      tick++;
      onStatus(`Generating ${stageName}${'.'.repeat((tick % 3) + 1)}`);
    }, 4000);

    let response: Anthropic.Message;
    try {
      response = await anthropic.messages.stream({
        model,
        max_tokens: maxTokens,
        system: [{ type: 'text', text: SYSTEM_PROMPT_MANIFEST, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userContent }],
      }).finalMessage();
    } finally {
      clearInterval(heartbeat);
    }

    lastWasTruncated = response.stop_reason === 'max_tokens';
    lastOutput = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('');
    const jsonStr = extractJson(lastOutput);

    try {
      const parsed = JSON.parse(jsonStr);
      // Unwrap if the model returned { "stage1": { ... } } instead of { ... }
      const data = (parsed[outputKey] !== undefined && typeof parsed[outputKey] === 'object') ? parsed[outputKey] : parsed;
      const validated = schema.parse(data) as T;
      if (stageNum === 2) {
        const s2 = validated as Stage2;
        const structuralErrors = validateBpmnElements(s2.workflowDiagram.elements);
        if (structuralErrors.length > 0) {
          lastError = `BPMN structural errors:\n${structuralErrors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
          if (attempt === MAX_RETRIES) {
            // Fallback: replace workflowDiagram with a simple linear BPMN built from taskRegister
            const fallbackDiagram = buildFallbackWorkflowDiagram(
              s2.taskRegister,
              s2.workflowDiagram.id,
              s2.workflowDiagram.name,
            );
            const patched = { ...s2, workflowDiagram: fallbackDiagram };
            return Stage2Schema.parse(patched) as T;
          }
          continue;
        }
        const coverageErrors = validateRegisterCoverage(
          s2.workflowDiagram.elements as DiagramElement[],
          s2.taskRegister,
        );
        if (coverageErrors.length > 0) {
          lastError = `Register coverage errors:\n${coverageErrors.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\n⚠ Every task/userTask/serviceTask element id must exactly match a taskId from taskRegister (T01, T02, ...).`;
          if (attempt === MAX_RETRIES) {
            const fallbackDiagram = buildFallbackWorkflowDiagram(
              s2.taskRegister,
              s2.workflowDiagram.id,
              s2.workflowDiagram.name,
            );
            const patched = { ...s2, workflowDiagram: fallbackDiagram };
            return Stage2Schema.parse(patched) as T;
          }
          continue;
        }
        // Quality rule check (hard-fail rules only — R2, R3, R4, R5, R7, R10)
        const qualityResults = validateDiagramQualityRules(
          s2.workflowDiagram as Parameters<typeof validateDiagramQualityRules>[0],
          {
            archetype: previousStages.stage1?.decompositionDecision?.archetype,
            tiersCount: s2.severityTierReconciliation?.length ?? 0,
            hasVariants: (s2.workflowVariants?.length ?? 0) > 0,
          },
        );
        const qualityHardFails = getHardFailErrors(qualityResults);
        if (qualityHardFails.length > 0) {
          lastError = `Diagram quality rule violations:\n${qualityHardFails.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
          if (attempt === MAX_RETRIES) return validated as T; // accept with violations on last attempt
          continue;
        }
      }
      return validated;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      // Reframe Zod branch-count errors as BPMN structural errors so the
      // BPMN-specific retry prompt fires (generic retry doesn't help here)
      if (lastError.includes('"branches"') && lastError.includes('too_small')) {
        lastError =
          `BPMN structural errors:\n` +
          `1. One or more gateways have fewer than 2 branches. ` +
          `Every gateway MUST have EXACTLY 2 or more branches — a gateway with 1 branch is invalid.\n` +
          `Fix: add a second branch to every gateway that currently has only 1 branch.`;
        if (attempt === MAX_RETRIES && stageNum === 2) {
          const raw = JSON.parse(extractJson(lastOutput));
          const data = (raw[stageOutputKeys[stageNum]] !== undefined && typeof raw[stageOutputKeys[stageNum]] === 'object')
            ? raw[stageOutputKeys[stageNum]] : raw;
          const fallbackDiagram = buildFallbackWorkflowDiagram(
            (data.taskRegister ?? []) as Array<{ taskId: string; name: string; digitizationMode: string }>,
            data.workflowDiagram?.id ?? 'Process_1',
            data.workflowDiagram?.name ?? 'Service Workflow',
          );
          const patched = { ...data, workflowDiagram: fallbackDiagram };
          return Stage2Schema.parse(patched) as T;
        }
      }
      lastWasTruncated = lastWasTruncated || isJsonTruncationError(err);
      if (attempt === MAX_RETRIES) throw new Error(`${stageName} generation failed after ${MAX_RETRIES} attempts. Last error: ${lastError}`);
    }
  }
  throw new Error('unreachable');
}

// ─── HTML rendering helpers ────────────────────────────────────────────────────

async function buildVariantXmls(variants: Array<{ tier: string; diagram: object }>): Promise<Array<{ tier: string; xml: string }>> {
  return Promise.all(variants.map(async v => {
    const raw = await generateBpmnXml(v.diagram as Parameters<typeof generateBpmnXml>[0]);
    const colored = await applyColors(raw, v.diagram as Parameters<typeof applyColors>[1]);
    return { tier: v.tier, xml: colored };
  }));
}

async function renderManifestHtmls(manifest: ServiceManifest): Promise<{
  stage0: string; stage1: string; stage2: string; stage3: string; complete: string;
}> {
  const serviceCode = manifest.stage0.serviceIdentification.serviceCode;
  const bpmnXml = await generateBpmnXml(manifest.stage2.workflowDiagram);
  const coloredXml = await applyColors(bpmnXml, manifest.stage2.workflowDiagram);
  const workflowCsv = manifest.stage2.workflowCsvSpec
    ? generateWorkflowCsv(manifest.stage2.workflowCsvSpec, serviceCode)
    : undefined;
  const bpmnXmlVariants = manifest.stage2.workflowVariants?.length
    ? await buildVariantXmls(manifest.stage2.workflowVariants)
    : undefined;

  return {
    stage0: stage0ManifestTemplate(manifest.stage0),
    stage1: stage1ManifestTemplate(manifest.stage1, serviceCode),
    stage2: stage2ManifestTemplate(manifest.stage2, coloredXml, serviceCode, workflowCsv, manifest.stage1.decompositionDecision.archetype, bpmnXmlVariants),
    stage3: stage3ManifestTemplate(manifest.stage3, serviceCode),
    complete: completeManifestTemplate(manifest, coloredXml),
  };
}

// ─── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? '';
  let text: string;
  let mode: string = 'service-card';
  let isFileUpload = false;
  let stageNum: 0 | 1 | 2 | 3 = 0;
  let previousStages: { stage0?: Stage0; stage1?: Stage1; stage2?: Stage2 } = {};

  let corrections: string | undefined;

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    mode = (form.get('mode') as string) ?? 'service-card';
    const stageParam = form.get('stage');
    const prevStagesParam = form.get('previousStages');
    const correctionsParam = form.get('corrections');
    if (stageParam !== null) stageNum = parseInt(stageParam as string, 10) as 0 | 1 | 2 | 3;
    if (prevStagesParam) { try { previousStages = JSON.parse(prevStagesParam as string); } catch {} }
    if (correctionsParam) corrections = String(correctionsParam);
    if (!file) return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseExcelBuffer(buffer, file.name);
    text = parsedFileToText(parsed);
    isFileUpload = true;
  } else {
    const body = await req.json() as {
      text: string; mode?: string; stage?: number;
      previousStages?: { stage0?: Stage0; stage1?: Stage1; stage2?: Stage2 };
      corrections?: string;
    };
    text = body.text;
    mode = body.mode ?? 'service-card';
    if (body.stage !== undefined) stageNum = body.stage as 0 | 1 | 2 | 3;
    if (body.previousStages) previousStages = body.previousStages;
    if (body.corrections) corrections = body.corrections;
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ── Mode: existing Service Card + BPMN ──────────────────────────────
        if (mode === 'service-card') {
          send(controller, encoder, {
            type: 'progress', step: 1,
            message: isFileUpload ? 'Reading spreadsheet data...' : 'Analyzing your process description...',
          });

          const definition = await generateDefinitionWithRetry(text, (msg) =>
            send(controller, encoder, { type: 'progress', step: 1, message: msg }));

          send(controller, encoder, { type: 'progress', step: 2, message: 'Validating service definition...' });
          send(controller, encoder, { type: 'progress', step: 3, message: 'Generating BPMN diagram...' });

          const bpmnXml = await generateBpmnXml(definition.bpmnProcess);
          const coloredXml = await applyColors(bpmnXml, definition.bpmnProcess);

          send(controller, encoder, { type: 'progress', step: 4, message: 'Building combined viewer...' });

          const html = combinedViewerTemplate(definition.serviceCard, coloredXml);
          send(controller, encoder, { type: 'complete', html });

        // ── Mode A: Single-Pass Manifest ─────────────────────────────────────
        } else if (mode === 'manifest-single') {
          send(controller, encoder, {
            type: 'progress', step: 1,
            message: isFileUpload ? 'Reading spreadsheet data...' : 'Analyzing service for full manifest...',
          });

          const manifest = await generateManifestWithRetry(text, (msg) =>
            send(controller, encoder, { type: 'progress', step: 1, message: msg }));

          send(controller, encoder, { type: 'progress', step: 2, message: 'Rendering Stage 0 — Service Definition...' });
          send(controller, encoder, { type: 'progress', step: 3, message: 'Rendering Stage 1–3 + complete manifest...' });
          send(controller, encoder, { type: 'progress', step: 4, message: 'Generating BPMN diagram...' });

          const outputs = await renderManifestHtmls(manifest);

          send(controller, encoder, { type: 'progress', step: 5, message: 'Packaging all 5 documents...' });
          send(controller, encoder, { type: 'manifest_complete', outputs });

        // ── Mode B: Stage-by-Stage ────────────────────────────────────────────
        } else if (mode === 'manifest-stage') {
          send(controller, encoder, {
            type: 'progress', step: 1,
            message: `Generating Stage ${stageNum}...`,
          });

          const serviceCode = previousStages.stage0?.serviceIdentification.serviceCode ?? 'DGE-SVC';

          if (stageNum === 0) {
            const stage0 = await generateStageWithRetry<Stage0>(0, text, {}, (msg) =>
              send(controller, encoder, { type: 'progress', step: 1, message: msg }), corrections);
            send(controller, encoder, { type: 'progress', step: 2, message: 'Rendering Stage 0...' });
            const html = stage0ManifestTemplate(stage0);
            send(controller, encoder, { type: 'stage_complete', stage: 0, html, manifest: stage0 });

          } else if (stageNum === 1) {
            const stage1 = await generateStageWithRetry<Stage1>(1, text, previousStages, (msg) =>
              send(controller, encoder, { type: 'progress', step: 1, message: msg }), corrections);
            send(controller, encoder, { type: 'progress', step: 2, message: 'Rendering Stage 1...' });
            const html = stage1ManifestTemplate(stage1, serviceCode);
            send(controller, encoder, { type: 'stage_complete', stage: 1, html, manifest: stage1 });

          } else if (stageNum === 2) {
            const stage2 = await generateStageWithRetry<Stage2>(2, text, previousStages, (msg) =>
              send(controller, encoder, { type: 'progress', step: 1, message: msg }), corrections);
            send(controller, encoder, { type: 'progress', step: 2, message: 'Generating BPMN and rendering Stage 2...' });
            const bpmnXml = await generateBpmnXml(stage2.workflowDiagram);
            const coloredXml = await applyColors(bpmnXml, stage2.workflowDiagram);
            const workflowCsv = stage2.workflowCsvSpec
              ? generateWorkflowCsv(stage2.workflowCsvSpec, serviceCode)
              : undefined;
            const bpmnXmlVariants = stage2.workflowVariants?.length
              ? await buildVariantXmls(stage2.workflowVariants)
              : undefined;
            const html = stage2ManifestTemplate(stage2, coloredXml, serviceCode, workflowCsv, previousStages.stage1?.decompositionDecision?.archetype, bpmnXmlVariants);
            send(controller, encoder, { type: 'stage_complete', stage: 2, html, manifest: stage2 });

          } else if (stageNum === 3) {
            const stage3 = await generateStageWithRetry<Stage3>(3, text, previousStages, (msg) =>
              send(controller, encoder, { type: 'progress', step: 1, message: msg }), corrections);
            send(controller, encoder, { type: 'progress', step: 2, message: 'Rendering Stage 3...' });
            const html = stage3ManifestTemplate(stage3, serviceCode);
            // If all stages available, also generate complete manifest
            let completeHtml: string | undefined;
            if (previousStages.stage0 && previousStages.stage1 && previousStages.stage2) {
              send(controller, encoder, { type: 'progress', step: 3, message: 'Building complete manifest...' });
              const fullManifest: ServiceManifest = {
                version: '2.6',
                stage0: previousStages.stage0,
                stage1: previousStages.stage1,
                stage2: previousStages.stage2,
                stage3,
              };
              const bpmnXml = await generateBpmnXml(previousStages.stage2.workflowDiagram);
              const coloredXml = await applyColors(bpmnXml, previousStages.stage2.workflowDiagram);
              completeHtml = completeManifestTemplate(fullManifest, coloredXml);
            }
            send(controller, encoder, { type: 'stage_complete', stage: 3, html, manifest: stage3, completeHtml });
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send(controller, encoder, { type: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

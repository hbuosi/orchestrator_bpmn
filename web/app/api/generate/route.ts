import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ServiceDefinitionSchema } from '@/lib/schemas/service-definition.schema';
import { ServiceManifestSchema, Stage0Schema, Stage1Schema, Stage2Schema, Stage3Schema } from '@/lib/schemas/manifest.schema';
import type { Stage0, Stage1, Stage2, Stage3, ServiceManifest } from '@/lib/schemas/manifest.schema';
import { generateBpmnXml } from '@/lib/generators/bpmn-xml.generator';
import { applyColors } from '@/lib/generators/bpmn-colors';
import { combinedViewerTemplate } from '@/lib/templates/combined-viewer.html';
import { stage0ManifestTemplate } from '@/lib/templates/stage0-manifest.html';
import { stage1ManifestTemplate } from '@/lib/templates/stage1-manifest.html';
import { stage2ManifestTemplate } from '@/lib/templates/stage2-manifest.html';
import { stage3ManifestTemplate } from '@/lib/templates/stage3-manifest.html';
import { completeManifestTemplate } from '@/lib/templates/complete-manifest.html';
import { parseExcelBuffer, parsedFileToText } from '@/lib/parsers/excel.parser';
import { validateBpmnElements } from '@/lib/validators/bpmn-structure.validator';

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL_FAST = 'claude-haiku-4-5-20251001';
const MODEL_SMART = 'claude-sonnet-4-6';
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

RULE 1 — EVERY branch must terminate correctly:
  Each gateway branch.path MUST end with {type:"endEvent"} UNLESS it is the
  single happy-path continuation branch (the one branch that moves forward).
  ALL error / rejection / incomplete branches MUST end with an endEvent.

RULE 2 — At most ONE open branch per gateway:
  Each exclusiveGateway may have AT MOST ONE branch without endEvent (the happy-path).

RULE 3 — No empty branch paths:
  Every branch.path must contain AT LEAST ONE task before any nested gateway.

RULE 4 — Maximum 3 gateway nesting levels.

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
STAGE 0 RULES:
═══════════════════════════════════════════════════
- serviceCode: format "DGE-XX-NNN" (e.g. "DGE-BL-001")
- category: only "life-event" | "business" | "informational"
- demandProfile.channels: only "online" | "app" | "call-center" | "in-person"
- capabilityReuseSearch: minimum 3 entries, decision: "consume" | "fork" | "new"
- stakeholderMap type: "reviewer" | "approver" | "escalation" | "informed" | "operator"

═══════════════════════════════════════════════════
STAGE 1 RULES:
═══════════════════════════════════════════════════
- decompositionDecision.archetype: "Capability" | "Composite" | "Orchestrating"
  * Capability = atomic service doing one thing end-to-end
  * Composite = bundles multiple capabilities sequentially
  * Orchestrating = calls other services (never does work itself)
- smellTests: minimum 3, result: "pass" | "fail" | "n/a"
- valueStream: 3–7 phases (phase is a number 1,2,3...)
- outcomeTargets.variance = computedSlaDays - statedSlaDays
- olaBreakdown executionMode: "Sequential" | "Parallel"
- lifecycleStage.stage: "Designing" | "Implementing" | "Operating" | "Retiring"
- serviceBoundary.calledServices[].cascadePattern: "Sequential" | "Parallel" | "Pre-existing"

═══════════════════════════════════════════════════
STAGE 2 RULES:
═══════════════════════════════════════════════════
- moduleId format: "MOD-01", "MOD-02", etc.
- taskId format: "T01", "T02", etc.
- taskTypeCode: short code like "USR", "SVC", "DEC", "INT", "NTF"
- digitizationMode: "automated" | "assisted" | "manual"
- subflowMaturity: "Candidate" | "Provisional" | "Ratified" | "Stable" | "Deprecated"
- loopGovernance type: "Resubmission" | "Rework" | "Negotiation"
- loopGovernance clockPolicy: "Stop" | "Continue" | "Mixed"
- workflowDiagram: BPMN process (same format as standard BPMN generation — see rules below)
- subflowAlignment wcpCode: WCP workflow control pattern code e.g. "WCP-01", "WCP-02"

BPMN STRUCTURAL RULES (workflowDiagram):
- EVERY branch must terminate: each branch.path ends with {type:"endEvent"} UNLESS it is the single happy-path continuation
- At most ONE open branch per gateway (the happy-path)
- No empty branch paths: every branch.path has at least one task
- Maximum 3 gateway nesting levels
- Every element has a unique ID
- colorKey "happy" → start/happy end, "system" → automated tasks, "manual" → human tasks, "error" → exceptions, "cancel" → rejection ends, "decision" → gateways

═══════════════════════════════════════════════════
STAGE 3 RULES:
═══════════════════════════════════════════════════
- dataContracts[].direction: "Inbound" | "Outbound"
- integrationPoints[].direction: "Outbound" | "Inbound" | "Bidirectional"
- kpiInheritance[].frequency: "Daily" | "Weekly" | "Monthly"
- automationCandidates[].phase: "Phase 1" | "Phase 2"
- risksOpenQuestions[].type: "Risk" | "Issue" | "Decision needed" | "Open question"
- buildHandoff.automationCandidates[].taskId must reference valid taskIds from stage2.taskRegister

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
- BPMN: max 14 elements total`;

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

function isJsonTruncationError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('position') || msg.includes('Unexpected end') || msg.includes('Unexpected token') || msg.includes("Expected ',' or");
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
    const useHaiku = attempt <= 2;
    const model: string = useHaiku ? MODEL_FAST : MODEL_SMART;
    const maxTokens: number = useHaiku ? 6000 : (lastWasTruncated ? 16000 : 8000);

    let userContent: string;
    if (attempt === 1) {
      userContent =
        `Generate a complete service definition for:\n\n${text}\n\n` +
        `${COMPACT_HINTS}\n\n` +
        `Before outputting verify: (1) every error/rejection branch ends with endEvent, ` +
        `(2) each gateway has at most 1 open branch, (3) no branch path is empty.`;
    } else if (lastWasTruncated) {
      userContent =
        `Your previous output was INCOMPLETE (JSON cut off mid-string). ` +
        `Regenerate the COMPLETE service definition from scratch for:\n\n${text}\n\n` +
        `${COMPACT_HINTS}\n` +
        `Output ONLY raw JSON — no explanation, no markdown fences.`;
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

    if (attempt === 1) onStatus('Calling AI model (fast mode)...');
    else if (useHaiku) onStatus(`Retrying — attempt ${attempt} of ${MAX_RETRIES}...`);
    else onStatus(`Switching to advanced model — attempt ${attempt} of ${MAX_RETRIES}...`);

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
    const jsonStr = lastOutput.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();

    try {
      const parsed = JSON.parse(jsonStr);
      const validated = ServiceDefinitionSchema.parse(parsed);
      const structuralErrors = validateBpmnElements(validated.bpmnProcess.elements);
      if (structuralErrors.length > 0) {
        lastError = `BPMN structural errors:\n${structuralErrors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
        if (attempt === MAX_RETRIES) throw new Error(`BPMN structural validation failed after ${MAX_RETRIES} attempts.\n${lastError}`);
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
    const useHaiku = attempt <= 2;
    const model: string = useHaiku ? MODEL_FAST : MODEL_SMART;
    const maxTokens: number = useHaiku ? 8000 : (lastWasTruncated ? 32000 : 16000);

    let userContent: string;
    if (attempt === 1) {
      userContent =
        `Generate a complete Service Manifest v2.6 for the following government service:\n\n${text}\n\n` +
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

    if (attempt === 1) onStatus('Generating Service Manifest (fast mode)...');
    else if (useHaiku) onStatus(`Retrying manifest — attempt ${attempt} of ${MAX_RETRIES}...`);
    else onStatus(`Switching to advanced model — attempt ${attempt} of ${MAX_RETRIES}...`);

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
    const jsonStr = lastOutput.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();

    try {
      const parsed = JSON.parse(jsonStr);
      const validated = ServiceManifestSchema.parse(parsed);
      const structuralErrors = validateBpmnElements(validated.stage2.workflowDiagram.elements);
      if (structuralErrors.length > 0) {
        lastError = `BPMN structural errors in stage2.workflowDiagram:\n${structuralErrors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
        if (attempt === MAX_RETRIES) throw new Error(`Manifest BPMN validation failed after ${MAX_RETRIES} attempts.\n${lastError}`);
        continue;
      }
      return validated;
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Manifest BPMN')) throw err;
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
): Promise<T> {
  const stageNames = ['Stage 0: Service Definition', 'Stage 1: Service Design', 'Stage 2: Task Model & Workflow', 'Stage 3: Build-Ready Requirements'];
  const stageSchemas = [Stage0Schema, Stage1Schema, Stage2Schema, Stage3Schema];
  const stageOutputKeys = ['stage0', 'stage1', 'stage2', 'stage3'];
  const stageFieldDescriptions = [
    `{ "serviceIdentification": {...}, "customerJourneyContext": {...}, "capabilityReuseSearch": [...], "demandProfile": {...}, "dataInventory": [...], "stakeholderMap": [...] }`,
    `{ "decompositionDecision": {...}, "serviceBoundary": {...}, "valueStream": [...], "outcomeTargets": {...}, "auditDrivers": [...], "lifecycleStage": {...} }`,
    `{ "moduleRegister": [...], "taskRegister": [...], "loopGovernance": [...], "workflowDiagram": {"id":"...","name":"...","elements":[...]}, "subflowAlignment": [...] }`,
    `{ "buildHandoff": { "dataContracts": [...], "integrationPoints": [...], "automationCandidates": [...] }, "kpiInheritance": [...], "operatingModel": {"raci":[...],"cadence":[...]}, "acceptanceCriteria": [...], "risksOpenQuestions": [...] }`,
  ];

  const schema = stageSchemas[stageNum]!;
  const outputKey = stageOutputKeys[stageNum]!;
  const stageName = stageNames[stageNum]!;

  let contextSection = '';
  if (previousStages.stage0) contextSection += `\nSTAGE 0 CONTEXT:\n${JSON.stringify(previousStages.stage0, null, 0).slice(0, 3000)}\n`;
  if (previousStages.stage1) contextSection += `\nSTAGE 1 CONTEXT:\n${JSON.stringify(previousStages.stage1, null, 0).slice(0, 2000)}\n`;
  if (previousStages.stage2) contextSection += `\nSTAGE 2 CONTEXT:\n${JSON.stringify(previousStages.stage2, null, 0).slice(0, 2000)}\n`;

  let lastError = '';
  let lastOutput = '';
  let lastWasTruncated = false;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const useHaiku = attempt <= 2;
    const model: string = useHaiku ? MODEL_FAST : MODEL_SMART;
    const maxTokens: number = useHaiku ? (stageNum === 2 ? 8000 : 6000) : (lastWasTruncated ? 16000 : 10000);

    let userContent: string;
    if (attempt === 1) {
      userContent =
        `Generate ${stageName} of the Service Manifest v2.6 for:\n\n${text}${contextSection}\n\n` +
        `Output ONLY raw JSON (no markdown) for the "${outputKey}" field:\n${stageFieldDescriptions[stageNum]}`;
    } else if (lastWasTruncated) {
      userContent =
        `Your previous output was INCOMPLETE. Regenerate ${stageName} from scratch for:\n\n${text}${contextSection}\n\n` +
        `Output ONLY raw JSON for "${outputKey}". Be concise — minimum required entries.`;
    } else {
      userContent =
        `Fix validation errors in ${stageName}.\n\nERRORS:\n${lastError}\n\nPREVIOUS OUTPUT:\n${lastOutput}\n\nReturn the full corrected "${outputKey}" JSON.`;
    }

    if (attempt === 1) onStatus(`Generating ${stageName} (fast mode)...`);
    else if (useHaiku) onStatus(`Retrying ${stageName} — attempt ${attempt}...`);
    else onStatus(`Advanced model — ${stageName} attempt ${attempt}...`);

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
    const jsonStr = lastOutput.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();

    try {
      const parsed = JSON.parse(jsonStr);
      const validated = schema.parse(parsed) as T;
      if (stageNum === 2) {
        const s2 = validated as Stage2;
        const structuralErrors = validateBpmnElements(s2.workflowDiagram.elements);
        if (structuralErrors.length > 0) {
          lastError = `BPMN structural errors:\n${structuralErrors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
          if (attempt === MAX_RETRIES) throw new Error(`Stage 2 BPMN validation failed.\n${lastError}`);
          continue;
        }
      }
      return validated;
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Stage 2 BPMN')) throw err;
      lastError = err instanceof Error ? err.message : String(err);
      lastWasTruncated = lastWasTruncated || isJsonTruncationError(err);
      if (attempt === MAX_RETRIES) throw new Error(`${stageName} generation failed after ${MAX_RETRIES} attempts. Last error: ${lastError}`);
    }
  }
  throw new Error('unreachable');
}

// ─── HTML rendering helpers ────────────────────────────────────────────────────

async function renderManifestHtmls(manifest: ServiceManifest): Promise<{
  stage0: string; stage1: string; stage2: string; stage3: string; complete: string;
}> {
  const serviceCode = manifest.stage0.serviceIdentification.serviceCode;
  const bpmnXml = await generateBpmnXml(manifest.stage2.workflowDiagram);
  const coloredXml = await applyColors(bpmnXml, manifest.stage2.workflowDiagram);

  return {
    stage0: stage0ManifestTemplate(manifest.stage0),
    stage1: stage1ManifestTemplate(manifest.stage1, serviceCode),
    stage2: stage2ManifestTemplate(manifest.stage2, coloredXml, serviceCode),
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

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    mode = (form.get('mode') as string) ?? 'service-card';
    if (!file) return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseExcelBuffer(buffer, file.name);
    text = parsedFileToText(parsed);
    isFileUpload = true;
  } else {
    const body = await req.json() as {
      text: string; mode?: string; stage?: number;
      previousStages?: { stage0?: Stage0; stage1?: Stage1; stage2?: Stage2 };
    };
    text = body.text;
    mode = body.mode ?? 'service-card';
    if (body.stage !== undefined) stageNum = body.stage as 0 | 1 | 2 | 3;
    if (body.previousStages) previousStages = body.previousStages;
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
              send(controller, encoder, { type: 'progress', step: 1, message: msg }));
            send(controller, encoder, { type: 'progress', step: 2, message: 'Rendering Stage 0...' });
            const html = stage0ManifestTemplate(stage0);
            send(controller, encoder, { type: 'stage_complete', stage: 0, html, manifest: stage0 });

          } else if (stageNum === 1) {
            const stage1 = await generateStageWithRetry<Stage1>(1, text, previousStages, (msg) =>
              send(controller, encoder, { type: 'progress', step: 1, message: msg }));
            send(controller, encoder, { type: 'progress', step: 2, message: 'Rendering Stage 1...' });
            const html = stage1ManifestTemplate(stage1, serviceCode);
            send(controller, encoder, { type: 'stage_complete', stage: 1, html, manifest: stage1 });

          } else if (stageNum === 2) {
            const stage2 = await generateStageWithRetry<Stage2>(2, text, previousStages, (msg) =>
              send(controller, encoder, { type: 'progress', step: 1, message: msg }));
            send(controller, encoder, { type: 'progress', step: 2, message: 'Generating BPMN and rendering Stage 2...' });
            const bpmnXml = await generateBpmnXml(stage2.workflowDiagram);
            const coloredXml = await applyColors(bpmnXml, stage2.workflowDiagram);
            const html = stage2ManifestTemplate(stage2, coloredXml, serviceCode);
            send(controller, encoder, { type: 'stage_complete', stage: 2, html, manifest: stage2 });

          } else if (stageNum === 3) {
            const stage3 = await generateStageWithRetry<Stage3>(3, text, previousStages, (msg) =>
              send(controller, encoder, { type: 'progress', step: 1, message: msg }));
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

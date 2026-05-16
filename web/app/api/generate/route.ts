import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ServiceDefinitionSchema } from '@/lib/schemas/service-definition.schema';
import { generateBpmnXml } from '@/lib/generators/bpmn-xml.generator';
import { applyColors } from '@/lib/generators/bpmn-colors';
import { combinedViewerTemplate } from '@/lib/templates/combined-viewer.html';
import { parseExcelBuffer, parsedFileToText } from '@/lib/parsers/excel.parser';
import { validateBpmnElements } from '@/lib/validators/bpmn-structure.validator';

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL_FAST = 'claude-haiku-4-5-20251001'; // primary — fast + cheap
const MODEL_SMART = 'claude-sonnet-4-6';          // fallback — thorough

const SYSTEM_PROMPT = `You are a BPMN 2.0 process modeling expert and government digital service designer specializing in UAE/Abu Dhabi TAMM standards.

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
  ❌ FORBIDDEN: a branch.path with no endEvent at the end (creates floating disconnected elements)
  ✅ REQUIRED: every branch that is not the happy-path continuation ends with endEvent

RULE 2 — At most ONE open branch per gateway:
  Each exclusiveGateway may have AT MOST ONE branch without endEvent (the happy-path).
  If a gateway has 2 or more branches without endEvent → BROKEN DIAGRAM.
  When both/all branches terminate: every branch ends with endEvent.
  When one branch continues: exactly ONE branch has no endEvent (happy path); all others end with endEvent.

RULE 3 — No empty branch paths:
  Every branch.path must contain AT LEAST ONE task before any nested gateway.
  ❌ FORBIDDEN: {"condition":"No","path":[]}
  ✅ REQUIRED: {"condition":"No","path":[{task},{endEvent}]}

RULE 4 — Maximum 3 gateway nesting levels:
  Level 1 (depth 0): top-level gateway — OK
  Level 2 (depth 1): gateway inside a branch — OK
  Level 3 (depth 2): gateway inside a branch of a branch — OK
  Level 4 (depth 3+): FORBIDDEN — flatten by converting nested gateways into sequential gateways at a higher level.

RULE 5 — Every element has a unique ID:
  IDs must never be reused. Use: start, task_1, task_2, gw_1, gw_2, end_ok, end_err1, end_err2, end_cancel1.

RULE 6 — Task labels are verb+object, 4 words max:
  "Validate Documents" ✅   "Notify Applicant" ✅   "The system checks whether the document is valid" ❌

RULE 7 — Gateway labels are questions ending in "?":
  "Documents Valid?" ✅   "Payment Required?" ✅   "Check status" ❌

RULE 8 — Branch conditions are 1–2 words max:
  "Yes" "No" "Valid" "Invalid" "Approved" "Rejected" "Complete" "Incomplete" ✅
  "Yes — approved by officer" ❌  "Straight-Through Processing" ❌

═══════════════════════════════════════════════════
CORRECT BPMN PATTERN — study this carefully:
═══════════════════════════════════════════════════

{
  "elements": [
    {"type":"startEvent","id":"start","label":"Start","colorKey":"happy"},
    {"type":"serviceTask","id":"task_1","label":"Validate Application","colorKey":"system"},
    {"type":"exclusiveGateway","id":"gw_1","label":"Application Valid?","branches":[
      {"condition":"Yes","path":[
        {"type":"userTask","id":"task_2","label":"Review by Officer","colorKey":"manual"},
        {"type":"exclusiveGateway","id":"gw_2","label":"Approved?","branches":[
          {"condition":"Approved","path":[
            {"type":"serviceTask","id":"task_3","label":"Issue Certificate","colorKey":"system"},
            {"type":"endEvent","id":"end_ok","label":"Certificate Issued","colorKey":"happy"}
          ]},
          {"condition":"Rejected","path":[
            {"type":"serviceTask","id":"task_4","label":"Notify Rejection","colorKey":"error"},
            {"type":"endEvent","id":"end_reject","label":"Application Rejected","colorKey":"cancel"}
          ]}
        ]}
      ]},
      {"condition":"No","path":[
        {"type":"serviceTask","id":"task_5","label":"Return for Correction","colorKey":"error"},
        {"type":"endEvent","id":"end_invalid","label":"Returned to Applicant","colorKey":"cancel"}
      ]}
    ]}
  ]
}

Note: BOTH branches of gw_2 end with endEvent. The "Yes" branch of gw_1 has no endEvent because it continues into gw_2. The "No" branch of gw_1 ends with endEvent. Result: zero floating elements, zero cascading gateways.

═══════════════════════════════════════════════════
SERVICE CARD CONSTRAINTS (hard limits):
═══════════════════════════════════════════════════
- journeySteps: MAXIMUM 7 steps (consolidate if needed)
- channels: only "online" | "app" | "call-center" | "in-person"
- targetSegment: only "citizen" | "resident" | "business" | "visitor"
- category: only "life-event" | "business" | "informational"
- transformationStage: only "paper" | "digital" | "smart" | "proactive"
- uaePassLevel: only 1, 2, or 3 (integer) — omit if uaePassEnabled is false

Output ONLY raw JSON (no markdown, no code blocks) exactly matching this structure:
{
  "version": "1.0",
  "serviceCard": {
    "serviceCode": "...",
    "nameEn": "...",
    "nameAr": "...",
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
    "id": "Process_...",
    "name": "...",
    "elements": [ ... ]
  },
  "generate": {"serviceCard":true,"bpmn":true,"pdf":true,"svg":true,"standaloneHtml":true}
}`;

// Attempts 1–2: Haiku (fast). Attempts 3–4: Sonnet (thorough fallback).
const MAX_RETRIES = 4;

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
        `5. Branch conditions: 1–2 words ("Yes" "No" "Valid" "Approved")\n` +
        `6. Nesting > 3 levels: FLATTEN — terminate the deep branch with endEvent, ` +
        `move the continuation logic to a sequential gateway at a higher level.\n` +
        `FLATTEN EXAMPLE:\n` +
        `BAD:  gw_1→Yes→gw_2→Approved→gw_3→OK→gw_4 (depth 4)\n` +
        `GOOD: gw_1→Yes→gw_2→Approved→gw_3→OK→[task+end_ok] | gw_3→Fail→[task+end_fail]`;
    }

    if (attempt === 1) {
      onStatus('Calling AI model (fast mode)...');
    } else if (useHaiku) {
      onStatus(`Retrying — attempt ${attempt} of ${MAX_RETRIES}...`);
    } else {
      onStatus(`Switching to advanced model — attempt ${attempt} of ${MAX_RETRIES}...`);
    }

    // Stream from Claude so we can emit SSE heartbeats while it generates
    let tick = 0;
    const heartbeat = setInterval(() => {
      tick++;
      const dots = '.'.repeat((tick % 3) + 1);
      onStatus(`Generating service definition${dots}`);
    }, 4000);

    let response: Anthropic.Message;
    try {
      response = await anthropic.messages.stream({
        model,
        max_tokens: maxTokens,
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userContent }],
      }).finalMessage();
    } finally {
      clearInterval(heartbeat);
    }

    lastWasTruncated = response.stop_reason === 'max_tokens';

    lastOutput = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');

    const jsonStr = lastOutput
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```\s*$/m, '')
      .trim();

    try {
      const parsed = JSON.parse(jsonStr);
      const validated = ServiceDefinitionSchema.parse(parsed);

      const structuralErrors = validateBpmnElements(validated.bpmnProcess.elements);
      if (structuralErrors.length > 0) {
        lastError = `BPMN structural errors:\n${structuralErrors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
        console.error(`[generate] attempt ${attempt}/${MAX_RETRIES} model=${model} — structural: ${structuralErrors[0]}`);
        if (attempt === MAX_RETRIES) {
          throw new Error(`BPMN structural validation failed after ${MAX_RETRIES} attempts.\n${lastError}`);
        }
        continue;
      }

      return validated;
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('BPMN structural')) throw err;
      lastError = err instanceof Error ? err.message : String(err);
      lastWasTruncated = lastWasTruncated || isJsonTruncationError(err);
      console.error(`[generate] attempt ${attempt}/${MAX_RETRIES} model=${model} failed (truncated=${lastWasTruncated}): ${lastError.slice(0, 200)}`);
      if (attempt === MAX_RETRIES) {
        throw new Error(`Generation failed after ${MAX_RETRIES} attempts. Last error: ${lastError}`);
      }
    }
  }

  throw new Error('unreachable');
}

function send(controller: ReadableStreamDefaultController, encoder: TextEncoder, data: object) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? '';
  let text: string;
  let isFileUpload = false;

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseExcelBuffer(buffer, file.name);
    text = parsedFileToText(parsed);
    isFileUpload = true;
  } else {
    ({ text } = await req.json() as { text: string });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        send(controller, encoder, {
          type: 'progress', step: 1,
          message: isFileUpload
            ? 'Reading spreadsheet data from all sheets...'
            : 'Analyzing your process description...',
        });

        const definition = await generateDefinitionWithRetry(text, (msg) =>
          send(controller, encoder, { type: 'progress', step: 1, message: msg }),
        );

        send(controller, encoder, { type: 'progress', step: 2, message: 'Validating service definition...' });
        send(controller, encoder, { type: 'progress', step: 3, message: 'Generating BPMN diagram...' });

        const bpmnXml = await generateBpmnXml(definition.bpmnProcess);
        const coloredXml = await applyColors(bpmnXml, definition.bpmnProcess);

        send(controller, encoder, { type: 'progress', step: 4, message: 'Building combined viewer...' });

        const html = combinedViewerTemplate(definition.serviceCard, coloredXml);

        send(controller, encoder, { type: 'complete', html });
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

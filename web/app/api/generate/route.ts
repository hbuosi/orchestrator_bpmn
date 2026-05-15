import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ServiceDefinitionSchema } from '@/lib/schemas/service-definition.schema';
import { generateBpmnXml } from '@/lib/generators/bpmn-xml.generator';
import { applyColors } from '@/lib/generators/bpmn-colors';
import { combinedViewerTemplate } from '@/lib/templates/combined-viewer.html';

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a BPMN 2.0 process modeling expert and government digital service designer specializing in UAE/Abu Dhabi TAMM standards.

Generate a complete service definition JSON including both a serviceCard and bpmnProcess.

The serviceCard must follow UAE TDRA standards with all required fields.
The bpmnProcess must model the happy path first, with exception branches diverging from gateways.

BPMN color rules:
- colorKey "happy" → start events and happy path start
- colorKey "system" → automated/API/service tasks
- colorKey "manual" → human/user tasks requiring interaction
- colorKey "error" → exception handling tasks and paths
- colorKey "cancel" → rejection/termination end events

BPMN structure rules:
- All gateways must have labeled branches (condition field)
- Task labels: verb + object format, max 4 words
- Gateway labels: question format ending with "?"
- Branch conditions: MAXIMUM 2 words — use only short decisive words like "Yes", "No", "Valid", "Invalid", "Approved", "Rejected", "Complete", "Incomplete". NEVER use phrases or sentences.
- Always include a startEvent and at least one endEvent
- Exception paths end with endEvent (type: "endEvent")

SERVICE CARD CONSTRAINTS (hard limits — never exceed):
- journeySteps: MAXIMUM 7 steps. If the process has more, consolidate related actions into fewer steps.
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
    "elements": [
      {"type":"startEvent","id":"start","label":"...","colorKey":"happy"},
      {"type":"serviceTask","id":"task_1","label":"...","colorKey":"system"},
      {"type":"exclusiveGateway","id":"gw_1","label":"Valid?","branches":[
        {"condition":"Yes","path":[
          {"type":"userTask","id":"task_2","label":"...","colorKey":"manual"},
          {"type":"endEvent","id":"end_ok","label":"...","colorKey":"happy"}
        ]},
        {"condition":"No","path":[
          {"type":"serviceTask","id":"task_err","label":"...","colorKey":"error"},
          {"type":"endEvent","id":"end_err","label":"...","colorKey":"cancel"}
        ]}
      ]}
    ]
  },
  "generate": {"serviceCard":true,"bpmn":true,"pdf":true,"svg":true,"standaloneHtml":true}
}`;

const MAX_RETRIES = 3;

async function generateDefinitionWithRetry(text: string): Promise<ReturnType<typeof ServiceDefinitionSchema.parse>> {
  let lastError = '';
  let lastOutput = '';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const userContent = attempt === 1
      ? `Generate a complete service definition for the following process:\n\n${text}`
      : `Your previous output failed validation.\n\nValidation error:\n${lastError}\n\nYour previous output:\n${lastOutput}\n\nFix ALL validation errors and return the corrected complete JSON. Pay special attention to array size limits (journeySteps: max 7).`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userContent }],
    });

    lastOutput = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('');

    const jsonStr = lastOutput
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```\s*$/m, '')
      .trim();

    try {
      const parsed = JSON.parse(jsonStr);
      return ServiceDefinitionSchema.parse(parsed);
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[generate] attempt ${attempt}/${MAX_RETRIES} failed: ${lastError.slice(0, 200)}`);
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
  const { text } = await req.json() as { text: string };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        send(controller, encoder, { type: 'progress', step: 1, message: 'Analyzing your process description...' });

        const definition = await generateDefinitionWithRetry(text);

        send(controller, encoder, { type: 'progress', step: 2, message: 'Parsing service definition...' });

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

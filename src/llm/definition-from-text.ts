import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { ServiceDefinitionSchema, type ServiceDefinition } from '../schemas/service-definition.schema.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── System Prompt ────────────────────────────────────────────────────────────
// Cached (ephemeral) — only charged once per session across retries.
// Includes the full schema inline so Claude never hallucinates field names.
const SYSTEM_PROMPT = `You are an expert in UAE/Abu Dhabi government digital services (TAMM platform) and BPMN 2.0 process modeling.

Your job: given a plain-text description of a government service, generate a COMPLETE service-definition JSON with TWO parts:
1. serviceCard — structured metadata per UAE TDRA Government Service Specifications Manual (15 mandatory fields)
2. bpmnProcess — BPMN 2.0 process definition using the JSON intermediate format

━━━ OUTPUT FORMAT ━━━
Return ONLY valid JSON, no markdown, no explanation. Start with { and end with }.

━━━ SERVICE CARD RULES ━━━
- serviceCode: format "ENTITY-TYPE-NNN" e.g. "TAMM-TL-001", "ADDED-BL-002"
- nameAr: always translate nameEn to Arabic
- category: one of "life-event" | "business" | "informational"
- channels: array of "online" | "app" | "call-center" | "in-person"
- targetSegment: array of "citizen" | "resident" | "business" | "visitor"
- journeySteps: MAX 7 steps. Each step must have: step (int), title (string), description (string). estimatedMinutes is optional — omit entirely if unknown (do NOT use null)
- slaDays: object mapping channel name to integer days e.g. {"online": 3, "in-person": 5}
- transformationStage: one of "paper" | "digital" | "smart" | "proactive"
- uaePassEnabled: true/false. If true, add uaePassLevel: 1, 2, or 3
- fees: if free, use amountAED: 0. Never omit fees array.
- outputDocuments: at least one document the service produces

━━━ BPMN PROCESS RULES ━━━
Elements types: "startEvent" | "endEvent" | "task" | "userTask" | "serviceTask" | "scriptTask" | "exclusiveGateway" | "parallelGateway" | "subProcess"

colorKey values (MANDATORY on every element):
- "happy"  → green  → normal/successful path
- "error"  → orange → errors, rejections, failed validations
- "cancel" → red    → cancellations, terminations
- "system" → blue   → automated tasks (API calls, validations)
- "manual" → white  → human tasks (reviews, uploads, payments)

Layout rules (enforced at render time):
- First element MUST be a startEvent
- Last elements in each terminal branch MUST be endEvents
- Gateways MUST have branches array with at least 2 branches
- Each branch MUST have: condition (string label), colorKey, path (array of elements)
- Task labels: verb + object, max 4 words ("Validate Documents", "Issue License")
- Gateway labels: question ending with "?" ("Documents Valid?", "Application Approved?")
- Model happy path first; exceptions branch off with "error" or "cancel" colorKey

━━━ BPMN PROCESS STRUCTURE ━━━
{
  "id": "Process_<ServiceCode>",
  "name": "<Service Name>",
  "elements": [
    { "type": "startEvent", "id": "start", "label": "<trigger event>", "colorKey": "happy" },
    { "type": "serviceTask", "id": "task_1", "label": "<action>", "colorKey": "system" },
    {
      "type": "exclusiveGateway", "id": "gw_1", "label": "<question>?", "colorKey": "happy",
      "branches": [
        { "condition": "<yes label>", "colorKey": "happy", "path": [ ...elements..., { "type": "endEvent", "id": "end_success", "label": "<success state>", "colorKey": "happy" } ] },
        { "condition": "<no label>", "colorKey": "error", "path": [ ...elements..., { "type": "endEvent", "id": "end_fail", "label": "<failure state>", "colorKey": "error" } ] }
      ]
    }
  ]
}

━━━ FULL OUTPUT SCHEMA ━━━
{
  "version": "1.0",
  "serviceCard": { ...15-field UAE TDRA format... },
  "bpmnProcess": { ...process elements as above... },
  "generate": { "serviceCard": true, "bpmn": true, "pdf": true, "svg": true, "standaloneHtml": true }
}`;

// ─── Self-correction loop ────────────────────────────────────────────────────
async function callWithRetry(
  userPrompt: string,
  maxRetries = 3,
): Promise<string> {
  let lastError = '';
  let lastOutput = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const content = attempt === 1
      ? userPrompt
      : `Your previous output failed validation.\n\nError:\n${lastError}\n\nYour previous output:\n${lastOutput}\n\nFix the errors and return the corrected complete JSON.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content }],
    });

    lastOutput = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('');

    // Strip markdown code fences if present
    const stripped = lastOutput.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();

    try {
      const parsed = JSON.parse(stripped);
      ServiceDefinitionSchema.parse(parsed);
      return stripped;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`  Attempt ${attempt}/${maxRetries} failed: ${lastError.slice(0, 120)}`);
      if (attempt === maxRetries) throw new Error(`LLM output invalid after ${maxRetries} attempts:\n${lastError}`);
    }
  }

  throw new Error('unreachable');
}

// ─── Public API ──────────────────────────────────────────────────────────────
export async function definitionFromText(description: string): Promise<ServiceDefinition> {
  const prompt = `Generate a complete service-definition JSON for the following government service:\n\n${description}`;
  const json = await callWithRetry(prompt);
  return ServiceDefinitionSchema.parse(JSON.parse(json));
}

export async function definitionFromTextRaw(description: string): Promise<string> {
  const prompt = `Generate a complete service-definition JSON for the following government service:\n\n${description}`;
  return callWithRetry(prompt);
}

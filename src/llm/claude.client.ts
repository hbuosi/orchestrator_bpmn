import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a BPMN 2.0 process modeling expert and government digital service designer.
You generate structured JSON representations of business processes following UAE/Abu Dhabi TAMM standards.

Rules:
- Always model the happy path first, then exceptions
- Happy path elements use colorKey "happy"
- Error/rejection paths use colorKey "error"
- Cancellation/termination use colorKey "cancel"
- Automated system tasks use colorKey "system"
- Human tasks use colorKey "manual"
- Task labels: verb + object format, max 4 words
- Gateway labels: question format ending with "?"
- All gateway branches must have a condition label`;

export async function generateBpmnFromText<T>(
  description: string,
  schema: z.ZodType<T>,
  retries = 3,
): Promise<T> {
  let lastError: Error | null = null;
  let lastOutput = '';

  for (let attempt = 1; attempt <= retries; attempt++) {
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: attempt === 1
          ? `Generate a BPMN process JSON for:\n\n${description}`
          : `Your previous output had validation errors:\n${lastError?.message}\n\nPrevious output:\n${lastOutput}\n\nPlease fix and return valid JSON.`,
      },
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages,
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('');

    lastOutput = text;

    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
    const jsonStr = jsonMatch[1]?.trim() ?? text.trim();

    try {
      const parsed = JSON.parse(jsonStr);
      const validated = schema.parse(parsed);
      return validated;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === retries) throw lastError;
    }
  }

  throw lastError!;
}

import { BpmnProcessSchema, type BpmnProcess } from '../schemas/bpmn-elements.schema.js';
import { generateBpmnFromText } from './claude.client.js';

export async function bpmnFromDescription(description: string): Promise<BpmnProcess> {
  return generateBpmnFromText(description, BpmnProcessSchema);
}

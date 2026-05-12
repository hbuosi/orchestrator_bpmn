import { layoutProcess } from 'bpmn-auto-layout';

// Takes BPMN XML without DI (Diagram Interchange) and returns XML with
// full layout — element positions, sizes, and connection routing — with zero overlap.
// Limitation: does not layout Groups, Text Annotations, Associations, Message Flows.
export async function applyAutoLayout(bpmnXml: string): Promise<string> {
  return layoutProcess(bpmnXml);
}

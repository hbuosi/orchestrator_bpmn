// Layout is now computed directly inside bpmn-xml.generator.ts.
// This module is retained for API compatibility only.
export async function applyAutoLayout(bpmnXml: string): Promise<string> {
  return bpmnXml;
}

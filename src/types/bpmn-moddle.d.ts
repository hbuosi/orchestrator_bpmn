declare module 'bpmn-moddle' {
  interface ModdleElement {
    $type: string;
    id?: string;
    name?: string;
    [key: string]: unknown;
  }

  interface ToXMLResult {
    xml: string;
  }

  interface FromXMLResult {
    rootElement: ModdleElement;
    warnings: string[];
  }

  export class BpmnModdle {
    create(type: string, attrs?: Record<string, unknown>): ModdleElement;
    toXML(element: ModdleElement, options?: { format?: boolean }): Promise<ToXMLResult>;
    fromXML(xml: string): Promise<FromXMLResult>;
  }

  export type { BpmnModdle };
}

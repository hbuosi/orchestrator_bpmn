import { describe, it, expect } from 'vitest';
import { generateBpmnXml } from '../bpmn-xml.generator';
import type { BpmnProcess, BpmnElement } from '@/lib/schemas/bpmn-elements.schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function minimalProcess(overrides?: Partial<BpmnProcess>): BpmnProcess {
  return {
    id: 'Process_test',
    name: 'Test Process',
    elements: [
      { type: 'startEvent',  id: 'start', label: 'Start' },
      { type: 'serviceTask', id: 'task1', label: 'Do Something' },
      { type: 'endEvent',    id: 'end',   label: 'End' },
    ],
    ...overrides,
  };
}

// ─── XML structure ────────────────────────────────────────────────────────────

describe('generateBpmnXml — XML structure', () => {
  it('produces a string starting with the XML declaration', async () => {
    const xml = await generateBpmnXml(minimalProcess());
    expect(xml).toMatch(/^<\?xml version="1\.0"/);
  });

  it('contains bpmn:definitions root element', async () => {
    const xml = await generateBpmnXml(minimalProcess());
    expect(xml).toContain('<bpmn:definitions');
  });

  it('contains bpmn:process element with the process id', async () => {
    const xml = await generateBpmnXml(minimalProcess());
    expect(xml).toContain('<bpmn:process id="Process_test"');
  });

  it('contains bpmn:process with the escaped process name', async () => {
    const xml = await generateBpmnXml(minimalProcess({ name: 'Test Process' }));
    expect(xml).toContain('name="Test Process"');
  });

  it('contains BPMNDiagram and BPMNPlane', async () => {
    const xml = await generateBpmnXml(minimalProcess());
    expect(xml).toContain('<bpmndi:BPMNDiagram');
    expect(xml).toContain('<bpmndi:BPMNPlane');
  });

  it('declares all required BPMN namespaces', async () => {
    const xml = await generateBpmnXml(minimalProcess());
    expect(xml).toContain('xmlns:bpmn=');
    expect(xml).toContain('xmlns:bpmndi=');
    expect(xml).toContain('xmlns:dc=');
    expect(xml).toContain('xmlns:di=');
    expect(xml).toContain('xmlns:bioc=');
    expect(xml).toContain('xmlns:color=');
  });
});

// ─── Minimal process (startEvent → task → endEvent) ──────────────────────────

describe('generateBpmnXml — minimal linear process', () => {
  it('includes a bpmn:startEvent element', async () => {
    const xml = await generateBpmnXml(minimalProcess());
    expect(xml).toContain('<bpmn:startEvent id="start"');
  });

  it('includes a bpmn:serviceTask element', async () => {
    const xml = await generateBpmnXml(minimalProcess());
    expect(xml).toContain('<bpmn:serviceTask id="task1"');
  });

  it('includes a bpmn:endEvent element', async () => {
    const xml = await generateBpmnXml(minimalProcess());
    expect(xml).toContain('<bpmn:endEvent id="end"');
  });

  it('generates sequenceFlow elements linking elements', async () => {
    const xml = await generateBpmnXml(minimalProcess());
    expect(xml).toContain('<bpmn:sequenceFlow');
    expect(xml).toContain('sourceRef="start"');
    expect(xml).toContain('targetRef="task1"');
  });

  it('generates BPMNShape entries for all elements', async () => {
    const xml = await generateBpmnXml(minimalProcess());
    expect(xml).toContain('bpmnElement="start"');
    expect(xml).toContain('bpmnElement="task1"');
    expect(xml).toContain('bpmnElement="end"');
  });

  it('generates BPMNEdge entries for all flows', async () => {
    const xml = await generateBpmnXml(minimalProcess());
    expect(xml).toContain('<bpmndi:BPMNEdge');
  });

  it('includes dc:Bounds for shapes with x/y/width/height', async () => {
    const xml = await generateBpmnXml(minimalProcess());
    expect(xml).toMatch(/<dc:Bounds x="\d+" y="\d+" width="\d+" height="\d+" \/>/);
  });

  it('includes di:waypoint entries for edges', async () => {
    const xml = await generateBpmnXml(minimalProcess());
    expect(xml).toContain('<di:waypoint');
  });

  it('escapes HTML special characters in element names', async () => {
    const proc: BpmnProcess = {
      id: 'Process_esc',
      name: 'Escape & Test',
      elements: [
        { type: 'startEvent',  id: 'start', label: 'Start <here>' },
        { type: 'endEvent',    id: 'end',   label: 'End & Done' },
      ],
    };
    const xml = await generateBpmnXml(proc);
    expect(xml).toContain('&lt;here&gt;');
    expect(xml).toContain('&amp; Done');
    expect(xml).not.toContain('<here>');
  });
});

// ─── Process with exclusiveGateway ───────────────────────────────────────────

describe('generateBpmnXml — process with exclusiveGateway', () => {
  function gatewayProcess(): BpmnProcess {
    return {
      id: 'Process_gw',
      name: 'Gateway Process',
      elements: [
        { type: 'startEvent', id: 'start', label: 'Start' },
        { type: 'serviceTask', id: 'task1', label: 'Validate Input' },
        {
          type: 'exclusiveGateway',
          id: 'gw_1',
          label: 'Valid?',
          branches: [
            {
              condition: 'Yes',
              path: [
                { type: 'serviceTask', id: 'task2', label: 'Process Request' },
                { type: 'endEvent',    id: 'end_ok', label: 'Done' },
              ],
            },
            {
              condition: 'No',
              path: [
                { type: 'serviceTask', id: 'task3', label: 'Return Error' },
                { type: 'endEvent',    id: 'end_err', label: 'Failed' },
              ],
            },
          ],
        },
      ],
    };
  }

  it('includes the exclusiveGateway element', async () => {
    const xml = await generateBpmnXml(gatewayProcess());
    expect(xml).toContain('<bpmn:exclusiveGateway id="gw_1"');
  });

  it('includes tasks from both branches', async () => {
    const xml = await generateBpmnXml(gatewayProcess());
    expect(xml).toContain('id="task2"');
    expect(xml).toContain('id="task3"');
  });

  it('includes endEvent elements from both branches', async () => {
    const xml = await generateBpmnXml(gatewayProcess());
    expect(xml).toContain('id="end_ok"');
    expect(xml).toContain('id="end_err"');
  });

  it('sets isMarkerVisible on the gateway shape', async () => {
    const xml = await generateBpmnXml(gatewayProcess());
    expect(xml).toContain('isMarkerVisible="true"');
  });

  it('emits branch condition labels on outgoing sequence flows', async () => {
    const xml = await generateBpmnXml(gatewayProcess());
    // The flow from gw_1 should carry the condition name
    expect(xml).toMatch(/name="Yes"|name="No"/);
  });

  it('generates BPMNShape entries for all branch elements', async () => {
    const xml = await generateBpmnXml(gatewayProcess());
    expect(xml).toContain('bpmnElement="task2"');
    expect(xml).toContain('bpmnElement="task3"');
    expect(xml).toContain('bpmnElement="end_ok"');
    expect(xml).toContain('bpmnElement="end_err"');
  });

  it('does NOT create an implicit join gateway when all branches end with endEvent', async () => {
    const xml = await generateBpmnXml(gatewayProcess());
    expect(xml).not.toContain('Gateway_join_');
  });
});

// ─── Gateway with one open (happy-path) branch creates join ──────────────────

describe('generateBpmnXml — gateway with one open branch', () => {
  function openBranchProcess(): BpmnProcess {
    return {
      id: 'Process_open',
      name: 'Open Branch',
      elements: [
        { type: 'startEvent', id: 'start', label: 'Start' },
        {
          type: 'exclusiveGateway',
          id: 'gw_1',
          label: 'Check?',
          branches: [
            {
              condition: 'Yes',
              path: [{ type: 'serviceTask', id: 'task_happy', label: 'Happy Path Task' }],
              // no endEvent — open / happy-path continuation
            },
            {
              condition: 'No',
              path: [
                { type: 'serviceTask', id: 'task_err', label: 'Error Task' },
                { type: 'endEvent',    id: 'end_err',  label: 'End Error' },
              ],
            },
          ],
        },
        { type: 'endEvent', id: 'end_main', label: 'End Main' },
      ],
    };
  }

  it('creates a converging join gateway for the open branch', async () => {
    const xml = await generateBpmnXml(openBranchProcess());
    expect(xml).toContain('Gateway_join_gw_1');
  });

  it('marks the join gateway with gatewayDirection Converging', async () => {
    const xml = await generateBpmnXml(openBranchProcess());
    expect(xml).toContain('gatewayDirection="Converging"');
  });
});

// ─── userTask and other task types ───────────────────────────────────────────

describe('generateBpmnXml — task type mapping', () => {
  const taskTypes: Array<{ type: BpmnElement['type']; tag: string }> = [
    { type: 'task',        tag: 'bpmn:task' },
    { type: 'userTask',    tag: 'bpmn:userTask' },
    { type: 'serviceTask', tag: 'bpmn:serviceTask' },
    { type: 'scriptTask',  tag: 'bpmn:scriptTask' },
    { type: 'manualTask',  tag: 'bpmn:manualTask' },
  ];

  for (const { type, tag } of taskTypes) {
    it(`maps type "${type}" to <${tag}>`, async () => {
      const proc: BpmnProcess = {
        id: 'Process_t',
        name: 'T',
        elements: [
          { type: 'startEvent', id: 'start', label: 'S' },
          { type, id: 'el1', label: 'El' } as BpmnElement,
          { type: 'endEvent', id: 'end', label: 'E' },
        ],
      };
      const xml = await generateBpmnXml(proc);
      expect(xml).toContain(`<${tag} id="el1"`);
    });
  }
});

// ─── Process name and id in output ────────────────────────────────────────────

describe('generateBpmnXml — process metadata', () => {
  it('uses the process id in the BPMNDiagram and BPMNPlane ids', async () => {
    const xml = await generateBpmnXml(minimalProcess());
    expect(xml).toContain('id="BPMNDiagram_Process_test"');
    expect(xml).toContain('id="BPMNPlane_Process_test"');
  });

  it('sets bpmnElement on BPMNPlane to the process id', async () => {
    const xml = await generateBpmnXml(minimalProcess());
    expect(xml).toContain(`bpmnElement="Process_test"`);
  });
});

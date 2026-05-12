import { BpmnModdle } from 'bpmn-moddle';
import type { BpmnProcess, BpmnElement, BpmnBranch as Branch } from '../schemas/bpmn-elements.schema.js';

const moddle = new BpmnModdle();

// Counter for unique IDs when auto-generating
let idCounter = 0;
const uid = (prefix: string) => `${prefix}_${++idCounter}`;

export async function generateBpmnXml(process: BpmnProcess): Promise<string> {
  idCounter = 0;

  const rootProcess = moddle.create('bpmn:Process', {
    id: process.id,
    name: process.name,
    isExecutable: false,
    flowElements: [],
  });

  const flowElements: object[] = [];
  const sequenceFlows: object[] = [];

  // Flatten elements into the process, tracking connections
  const { firstId, lastIds } = buildElements(
    process.elements,
    flowElements,
    sequenceFlows,
  );

  // Wire dangling last elements to an implicit end if none exists
  for (const lastId of lastIds) {
    const alreadyEndsAtEnd = (flowElements as Array<{ $type: string; id: string }>)
      .some(e => e.$type === 'bpmn:EndEvent' && e.id === lastId);
    if (!alreadyEndsAtEnd) {
      const endId = uid('EndEvent');
      flowElements.push(moddle.create('bpmn:EndEvent', { id: endId, name: '' }));
      sequenceFlows.push(createFlow(lastId, endId));
    }
  }

  (rootProcess as unknown as { flowElements: object[] }).flowElements = [
    ...flowElements,
    ...sequenceFlows,
  ];

  const definitions = moddle.create('bpmn:Definitions', {
    targetNamespace: 'http://bpmn.io/schema/bpmn',
    rootElements: [rootProcess],
  });

  const { xml } = await moddle.toXML(definitions, { format: true });
  return xml;
}

function createFlow(sourceId: string, targetId: string, name?: string): object {
  return moddle.create('bpmn:SequenceFlow', {
    id: uid('Flow'),
    name: name ?? '',
    sourceRef: { id: sourceId },
    targetRef: { id: targetId },
  });
}

function buildElements(
  elements: BpmnElement[],
  flowElements: object[],
  sequenceFlows: object[],
): { firstId: string; lastIds: string[] } {
  let previousIds: string[] = [];
  let firstId = '';

  for (const el of elements) {
    const created = createElement(el);
    flowElements.push(created);

    const currentId = (created as { id: string }).id;
    if (!firstId) firstId = currentId;

    for (const prevId of previousIds) {
      sequenceFlows.push(createFlow(prevId, currentId));
    }

    if (el.type === 'exclusiveGateway' || el.type === 'parallelGateway' || el.type === 'inclusiveGateway') {
      const convergenceId = uid('Gateway_converge');
      const convergenceGateway = moddle.create('bpmn:' + capitalize(el.type), {
        id: convergenceId,
        name: '',
        gatewayDirection: 'Converging',
      });
      flowElements.push(convergenceGateway);

      const branchLastIds: string[] = [];
      for (const branch of (el as { branches: Branch[] }).branches) {
        const branchResult = buildElements(branch.path, flowElements, sequenceFlows);
        sequenceFlows.push(createFlow(currentId, branchResult.firstId, branch.condition));
        branchLastIds.push(...branchResult.lastIds);
      }

      for (const branchLastId of branchLastIds) {
        sequenceFlows.push(createFlow(branchLastId, convergenceId));
      }

      previousIds = [convergenceId];
    } else {
      previousIds = [currentId];
    }
  }

  return { firstId, lastIds: previousIds };
}

function createElement(el: BpmnElement): object {
  const bpmnType = toBpmnType(el.type);
  return moddle.create(bpmnType, { id: el.id, name: el.label });
}

function toBpmnType(type: string): string {
  const map: Record<string, string> = {
    task: 'bpmn:Task',
    userTask: 'bpmn:UserTask',
    serviceTask: 'bpmn:ServiceTask',
    scriptTask: 'bpmn:ScriptTask',
    manualTask: 'bpmn:ManualTask',
    sendTask: 'bpmn:SendTask',
    receiveTask: 'bpmn:ReceiveTask',
    startEvent: 'bpmn:StartEvent',
    endEvent: 'bpmn:EndEvent',
    intermediateCatchEvent: 'bpmn:IntermediateCatchEvent',
    intermediateThrowEvent: 'bpmn:IntermediateThrowEvent',
    exclusiveGateway: 'bpmn:ExclusiveGateway',
    parallelGateway: 'bpmn:ParallelGateway',
    inclusiveGateway: 'bpmn:InclusiveGateway',
    eventBasedGateway: 'bpmn:EventBasedGateway',
    subProcess: 'bpmn:SubProcess',
  };
  return map[type] ?? 'bpmn:Task';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

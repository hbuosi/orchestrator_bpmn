import { z } from 'zod';

const ColorKeySchema = z.enum([
  'happy', 'error', 'cancel', 'compensation',
  'system', 'manual', 'subprocess', 'default',
]);

const BaseElementSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  colorKey: ColorKeySchema.optional(),
});

const TaskSchema = BaseElementSchema.extend({
  type: z.enum(['task', 'userTask', 'serviceTask', 'scriptTask', 'manualTask', 'sendTask', 'receiveTask']),
});

const EventSchema = BaseElementSchema.extend({
  type: z.enum(['startEvent', 'endEvent', 'intermediateCatchEvent', 'intermediateThrowEvent']),
  eventDefinition: z.enum(['none', 'timer', 'message', 'error', 'signal', 'terminate']).default('none'),
});

// Forward reference for recursive subProcess
type BpmnElement =
  | z.infer<typeof TaskSchema>
  | z.infer<typeof EventSchema>
  | z.infer<typeof GatewaySchema>
  | z.infer<typeof SubProcessSchema>;

const BpmnElementSchema: z.ZodType<BpmnElement> = z.lazy(() =>
  z.discriminatedUnion('type', [
    TaskSchema,
    EventSchema,
    GatewaySchema,
    SubProcessSchema,
  ]),
);

const BranchSchema = z.object({
  condition: z.string().min(1),
  conditionExpression: z.string().optional(),
  colorKey: ColorKeySchema.optional(),
  path: z.array(BpmnElementSchema),
});

const GatewaySchema = BaseElementSchema.extend({
  type: z.enum(['exclusiveGateway', 'parallelGateway', 'inclusiveGateway', 'eventBasedGateway']),
  branches: z.array(BranchSchema).min(2),
});

const SubProcessSchema = BaseElementSchema.extend({
  type: z.literal('subProcess'),
  collapsed: z.boolean().default(true),
  elements: z.array(BpmnElementSchema),
});

const ParticipantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  colorKey: ColorKeySchema.optional(),
});

export const BpmnProcessSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  participants: z.array(ParticipantSchema).optional(),
  elements: z.array(BpmnElementSchema).min(1),
});

export type BpmnProcess = z.infer<typeof BpmnProcessSchema>;
export type BpmnElement = z.infer<typeof BpmnElementSchema>;
export type Branch = z.infer<typeof BranchSchema>;

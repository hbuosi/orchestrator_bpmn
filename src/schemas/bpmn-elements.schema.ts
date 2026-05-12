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
  eventDefinition: z.enum(['none', 'timer', 'message', 'error', 'signal', 'terminate']).optional(),
});

// Use z.ZodType<any> for the recursive lazy schema to satisfy TypeScript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BpmnElementSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    TaskSchema,
    EventSchema,
    z.object({
      type: z.enum(['exclusiveGateway', 'parallelGateway', 'inclusiveGateway', 'eventBasedGateway']),
      id: z.string().min(1),
      label: z.string().min(1),
      colorKey: ColorKeySchema.optional(),
      branches: z.array(z.object({
        condition: z.string().min(1),
        conditionExpression: z.string().optional(),
        colorKey: ColorKeySchema.optional(),
        path: z.array(BpmnElementSchema),
      })).min(2),
    }),
    z.object({
      type: z.literal('subProcess'),
      id: z.string().min(1),
      label: z.string().min(1),
      colorKey: ColorKeySchema.optional(),
      collapsed: z.boolean().default(true),
      elements: z.array(BpmnElementSchema),
    }),
  ]),
);

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

// Concrete types derived from the schemas
export type ColorKey = z.infer<typeof ColorKeySchema>;
export type BpmnProcess = z.infer<typeof BpmnProcessSchema>;

// Manual type that mirrors the recursive structure for use in generator code
export interface BpmnBranch {
  condition: string;
  conditionExpression?: string;
  colorKey?: ColorKey;
  path: BpmnElement[];
}

export type BpmnElement =
  | { type: 'task' | 'userTask' | 'serviceTask' | 'scriptTask' | 'manualTask' | 'sendTask' | 'receiveTask'; id: string; label: string; colorKey?: ColorKey }
  | { type: 'startEvent' | 'endEvent' | 'intermediateCatchEvent' | 'intermediateThrowEvent'; id: string; label: string; colorKey?: ColorKey; eventDefinition?: string }
  | { type: 'exclusiveGateway' | 'parallelGateway' | 'inclusiveGateway' | 'eventBasedGateway'; id: string; label: string; colorKey?: ColorKey; branches: BpmnBranch[] }
  | { type: 'subProcess'; id: string; label: string; colorKey?: ColorKey; collapsed?: boolean; elements: BpmnElement[] };

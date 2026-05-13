import { z } from 'zod';
import { ServiceCardSchema } from './service-card.schema';
import { BpmnProcessSchema } from './bpmn-elements.schema';

export const ServiceDefinitionSchema = z.object({
  version: z.string().default('1.0'),
  serviceCard: ServiceCardSchema,
  bpmnProcess: BpmnProcessSchema,
  generate: z.object({
    serviceCard: z.boolean().default(true),
    bpmn: z.boolean().default(true),
    pdf: z.boolean().default(true),
    svg: z.boolean().default(true),
    standaloneHtml: z.boolean().default(true),
  }).default({}),
});

export type ServiceDefinition = z.infer<typeof ServiceDefinitionSchema>;

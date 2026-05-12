import { z } from 'zod';
import { ServiceCardSchema } from './service-card.schema.js';
import { BpmnProcessSchema } from './bpmn-elements.schema.js';

// The single input file that drives all generation
export const ServiceDefinitionSchema = z.object({
  version: z.string().default('1.0'),
  serviceCard: ServiceCardSchema,
  bpmnProcess: BpmnProcessSchema,
  // Optional: override what to generate
  generate: z.object({
    serviceCard: z.boolean().default(true),
    bpmn: z.boolean().default(true),
    pdf: z.boolean().default(true),
    svg: z.boolean().default(true),
    standaloneHtml: z.boolean().default(true),
  }).default({}),
});

export type ServiceDefinition = z.infer<typeof ServiceDefinitionSchema>;

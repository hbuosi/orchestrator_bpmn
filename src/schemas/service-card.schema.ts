import { z } from 'zod';

// UAE TDRA Government Service Specifications Manual — 15 mandatory fields
// + Abu Dhabi TAMM extensions
export const ServiceCardSchema = z.object({
  // Identity
  serviceCode: z.string().min(1),
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  category: z.enum(['life-event', 'business', 'informational']),
  owningEntity: z.string().min(1),

  // Delivery
  channels: z.array(z.enum(['online', 'app', 'call-center', 'in-person'])).min(1),
  targetSegment: z.array(z.enum(['citizen', 'resident', 'business', 'visitor'])).min(1),

  // Process
  eligibilityCriteria: z.array(z.string()).min(1),
  requiredDocuments: z.array(z.object({
    name: z.string(),
    format: z.string().optional(),
    notes: z.string().optional(),
  })),
  journeySteps: z.array(z.object({
    step: z.number().int().positive(),
    title: z.string(),
    description: z.string(),
    estimatedMinutes: z.number().optional(),
  })).max(7),

  // Commercial
  fees: z.array(z.object({
    channel: z.string(),
    applicantType: z.string().optional(),
    amountAED: z.number().nonnegative(),
  })),
  slaDays: z.record(z.string(), z.number().int().positive()),

  // Legal & Compliance
  legalBasis: z.string().min(1),
  transformationStage: z.enum(['paper', 'digital', 'smart', 'proactive']),
  uaePassEnabled: z.boolean(),
  uaePassLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),

  // Output
  outputDocuments: z.array(z.object({
    name: z.string(),
    format: z.string(),
    validityDays: z.number().optional(),
    deliveryMethod: z.string(),
  })),

  // TAMM extensions (optional)
  lifeEvent: z.string().optional(),
  prerequisiteServices: z.array(z.string()).optional(),
  integrationApis: z.array(z.string()).optional(),
  addaComplianceLevel: z.string().optional(),
});

export type ServiceCard = z.infer<typeof ServiceCardSchema>;

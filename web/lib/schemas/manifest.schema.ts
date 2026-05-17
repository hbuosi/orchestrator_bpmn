import { z } from 'zod';
import { BpmnProcessSchema } from './bpmn-elements.schema';

// ─── Stage 0 — Service Definition ───────────────────────────────────────────

export const ServiceIdentificationSchema = z.object({
  serviceCode: z.string(),
  nameEn: z.string(),
  nameAr: z.string(),
  category: z.enum(['life-event', 'business', 'informational']),
  owningEntity: z.string(),
  boundary: z.object({
    inScope: z.array(z.string()).min(1),
    outOfScope: z.array(z.string()).min(1),
  }),
  trigger: z.string(),
  outcome: z.string(),
});

export const CustomerJourneyContextSchema = z.object({
  journeyPhase: z.string(),
  precedingService: z.string().optional(),
  followingService: z.string().optional(),
  touchpoints: z.array(z.string()),
  painPoints: z.array(z.string()),
});

export const CapabilityReuseSearchSchema = z.array(z.object({
  searchTerm: z.string(),
  matchFound: z.boolean(),
  matchName: z.string().optional(),
  decision: z.enum(['consume', 'fork', 'new']),
  rationale: z.string(),
})).min(3);

export const DemandProfileSchema = z.object({
  annualVolume: z.number(),
  volumeBasis: z.string(),
  peakPeriods: z.array(z.string()),
  channels: z.array(z.enum(['online', 'app', 'call-center', 'in-person'])),
  capacityBaseline: z.string(),
});

export const DataInventorySchema = z.array(z.object({
  dataElement: z.string(),
  creates: z.boolean(),
  reads: z.boolean(),
  updates: z.boolean(),
  deletes: z.boolean(),
  classification: z.string(),
  retentionDays: z.number().optional(),
}));

export const StakeholderMapSchema = z.array(z.object({
  role: z.string(),
  type: z.enum(['reviewer', 'approver', 'escalation', 'informed', 'operator']),
  responsibilities: z.array(z.string()),
  organization: z.string().optional(),
}));

export const Stage0Schema = z.object({
  serviceIdentification: ServiceIdentificationSchema,
  customerJourneyContext: CustomerJourneyContextSchema,
  capabilityReuseSearch: CapabilityReuseSearchSchema,
  demandProfile: DemandProfileSchema,
  dataInventory: DataInventorySchema,
  stakeholderMap: StakeholderMapSchema,
});

export type Stage0 = z.infer<typeof Stage0Schema>;

// ─── Stage 1 — Service Design ────────────────────────────────────────────────

export const DecompositionDecisionSchema = z.object({
  archetype: z.enum(['Capability', 'Composite', 'Orchestrating']),
  smellTests: z.array(z.object({
    test: z.string(),
    result: z.enum(['pass', 'fail', 'n/a']),
    notes: z.string(),
  })).min(3),
  rationale: z.string(),
  calledServices: z.array(z.string()),
  decisionLog: z.array(z.object({
    date: z.string(),
    decision: z.string(),
    reviewer: z.string(),
  })),
});

export const ServiceBoundarySchema = z.object({
  inputs: z.array(z.object({ name: z.string(), format: z.string(), source: z.string() })),
  outputs: z.array(z.object({ name: z.string(), format: z.string(), destination: z.string() })),
  calledServices: z.array(z.object({
    service: z.string(),
    cascadePattern: z.enum(['Sequential', 'Parallel', 'Pre-existing']),
    ola: z.string(),
  })),
});

export const ValueStreamSchema = z.array(z.object({
  phase: z.number(),
  name: z.string(),
  customerActivity: z.string(),
  serviceActivity: z.string(),
})).min(3).max(7);

export const OutcomeTargetsSchema = z.object({
  statedSlaDays: z.number(),
  computedSlaDays: z.number(),
  variance: z.number(),
  varianceJustification: z.string().optional(),
  olaBreakdown: z.array(z.object({
    service: z.string(),
    olaDays: z.number(),
    executionMode: z.enum(['Sequential', 'Parallel']),
  })),
});

export const AuditDriversSchema = z.array(z.object({
  controlStep: z.string(),
  regulation: z.string(),
  evidenceRequired: z.string(),
  retentionDays: z.number(),
}));

export const LifecycleStageSchema = z.object({
  stage: z.enum(['Designing', 'Implementing', 'Operating', 'Retiring']),
  annualReviewDate: z.string(),
});

export const Stage1Schema = z.object({
  decompositionDecision: DecompositionDecisionSchema,
  serviceBoundary: ServiceBoundarySchema,
  valueStream: ValueStreamSchema,
  outcomeTargets: OutcomeTargetsSchema,
  auditDrivers: AuditDriversSchema,
  lifecycleStage: LifecycleStageSchema,
});

export type Stage1 = z.infer<typeof Stage1Schema>;

// ─── Stage 2 — Task Model & Workflow ─────────────────────────────────────────

export const ModuleRegisterSchema = z.array(z.object({
  moduleId: z.string(),
  name: z.string(),
  description: z.string(),
  ola: z.string(),
  alignedSubflow: z.string(),
  subflowMaturity: z.enum(['Candidate', 'Provisional', 'Ratified', 'Stable', 'Deprecated']),
}));

export const TaskRegisterSchema = z.array(z.object({
  taskId: z.string(),
  moduleId: z.string(),
  name: z.string(),
  description: z.string(),
  taskTypeCode: z.string(),
  digitizationMode: z.enum(['automated', 'assisted', 'manual']),
  olaFull: z.string(),
  olaCompact: z.string(),
  capacityAssumption: z.string(),
  exceptionPath: z.string(),
  automationCandidate: z.boolean(),
  lane: z.string(),
}));

export const LoopGovernanceSchema = z.array(z.object({
  loopId: z.string(),
  type: z.enum(['Resubmission', 'Rework', 'Negotiation']),
  reentryTaskId: z.string(),
  maxCycles: z.number(),
  timeout: z.string(),
  escalationPath: z.string(),
  clockPolicy: z.enum(['Stop', 'Continue', 'Mixed']),
  reasonCodes: z.array(z.string()),
}));

export const SubflowAlignmentSchema = z.array(z.object({
  moduleId: z.string(),
  pattern: z.string(),
  wcpCode: z.string(),
  deviation: z.string().optional(),
}));

export const Stage2Schema = z.object({
  moduleRegister: ModuleRegisterSchema,
  taskRegister: TaskRegisterSchema,
  loopGovernance: LoopGovernanceSchema,
  workflowDiagram: BpmnProcessSchema,
  subflowAlignment: SubflowAlignmentSchema,
});

export type Stage2 = z.infer<typeof Stage2Schema>;

// ─── Stage 3 — Build-Ready Requirements ──────────────────────────────────────

export const DataContractSchema = z.array(z.object({
  name: z.string(),
  direction: z.enum(['Inbound', 'Outbound']),
  schemaDescription: z.string(),
  mandatoryFields: z.array(z.string()),
  optionalFields: z.array(z.string()),
  versioningStrategy: z.string(),
}));

export const IntegrationPointSchema = z.array(z.object({
  system: z.string(),
  direction: z.enum(['Outbound', 'Inbound', 'Bidirectional']),
  protocol: z.string(),
  frequency: z.string(),
  authentication: z.string(),
  fallbackBehavior: z.string(),
}));

export const AutomationCandidateSchema = z.array(z.object({
  taskId: z.string(),
  automationMode: z.string(),
  buildApproach: z.string(),
  prerequisites: z.array(z.string()),
  phase: z.enum(['Phase 1', 'Phase 2']),
}));

export const KPIInheritanceSchema = z.array(z.object({
  name: z.string(),
  definition: z.string(),
  sourceTasks: z.array(z.string()),
  parentKpi: z.string().optional(),
  childKpi: z.string().optional(),
  frequency: z.enum(['Daily', 'Weekly', 'Monthly']),
  baseline: z.string(),
  target: z.string(),
}));

export const OperatingModelSchema = z.object({
  raci: z.array(z.object({
    activity: z.string(),
    responsible: z.string(),
    accountable: z.string(),
    consulted: z.string(),
    informed: z.string(),
  })),
  cadence: z.array(z.object({
    forum: z.string(),
    frequency: z.string(),
    attendees: z.string(),
    purpose: z.string(),
  })),
});

export const AcceptanceCriteriaSchema = z.array(z.object({
  criterion: z.string(),
  testApproach: z.string(),
  passThreshold: z.string(),
  testOwner: z.string(),
}));

export const RisksSchema = z.array(z.object({
  item: z.string(),
  type: z.enum(['Risk', 'Issue', 'Decision needed', 'Open question']),
  owner: z.string(),
  resolutionDate: z.string(),
  notes: z.string(),
}));

export const Stage3Schema = z.object({
  buildHandoff: z.object({
    dataContracts: DataContractSchema,
    integrationPoints: IntegrationPointSchema,
    automationCandidates: AutomationCandidateSchema,
  }),
  kpiInheritance: KPIInheritanceSchema,
  operatingModel: OperatingModelSchema,
  acceptanceCriteria: AcceptanceCriteriaSchema,
  risksOpenQuestions: RisksSchema,
});

export type Stage3 = z.infer<typeof Stage3Schema>;

// ─── Complete Manifest ────────────────────────────────────────────────────────

export const ServiceManifestSchema = z.object({
  version: z.literal('2.6'),
  stage0: Stage0Schema,
  stage1: Stage1Schema,
  stage2: Stage2Schema,
  stage3: Stage3Schema,
});

export type ServiceManifest = z.infer<typeof ServiceManifestSchema>;

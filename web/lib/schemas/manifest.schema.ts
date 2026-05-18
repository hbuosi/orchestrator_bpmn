import { z } from 'zod';
import { BpmnProcessSchema } from './bpmn-elements.schema';

// ─── Stage 0 — Service Definition ───────────────────────────────────────────

export const ServiceIdentificationSchema = z.object({
  serviceCode: z.string(),
  nameEn: z.string(),
  nameAr: z.string(),
  domain: z.string().optional(),
  category: z.enum(['life-event', 'business', 'informational']),
  owningEntity: z.string(),
  serviceOwner: z.string().optional(),
  serviceSponsor: z.string().optional(),
  customerType: z.string().optional(),
  servicePurpose: z.string().optional(),
  boundary: z.object({
    inScope: z.array(z.string()).min(1),
    outOfScope: z.array(z.string()).min(1),
  }),
  trigger: z.string(),
  outcome: z.string(),
  outcomeRejection: z.string().optional(),
});

export const CustomerJourneyContextSchema = z.object({
  journeyPhase: z.string(),
  precedingService: z.string().optional(),
  followingService: z.string().optional(),
  touchpoints: z.array(z.string()),
  painPoints: z.array(z.string()),
  triggerEvent: z.string().optional(),
  touchpointChannel: z.string().optional(),
  customerMindset: z.string().optional(),
  adjacentServices: z.string().optional(),
  customerEffortScore: z.string().optional(),
  journeyMapReference: z.string().optional(),
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
  dailyAverage: z.string().optional(),
  peakDay: z.string().optional(),
  channelMix: z.string().optional(),
  customerSegments: z.string().optional(),
  capacityConstraints: z.string().optional(),
  seasonalityVariability: z.string().optional(),
});

export const DataInventorySchema = z.array(z.object({
  dataElement: z.string(),
  creates: z.boolean(),
  reads: z.boolean(),
  updates: z.boolean(),
  deletes: z.boolean(),
  classification: z.string(),
  retentionDays: z.number(),
  sourceSinkSystem: z.string().optional(),
  retention: z.string().optional(),
}));

export const AsIsProcessAnalysisSchema = z.object({
  applicable: z.boolean(),
  currentStateDescription: z.string().optional(),
  currentProcessOwner: z.string().optional(),
  knownPainPoints: z.array(z.string()).optional(),
  replacementRationale: z.string().optional(),
  currentVolume: z.string().optional(),
  currentCycleTime: z.string().optional(),
  currentTooling: z.string().optional(),
  currentSlaPerformance: z.string().optional(),
  whatMustBePreserved: z.string().optional(),
  whatMustChange: z.string().optional(),
});

export const StakeholderMapSchema = z.array(z.object({
  role: z.string(),
  type: z.enum(['reviewer', 'approver', 'escalation', 'informed', 'operator']),
  responsibilities: z.array(z.string()),
  organization: z.string().optional(),
  engagementLevel: z.string().optional(),
  decisionRights: z.string().optional(),
}));

export const Stage0Schema = z.object({
  serviceIdentification: ServiceIdentificationSchema,
  customerJourneyContext: CustomerJourneyContextSchema,
  capabilityReuseSearch: CapabilityReuseSearchSchema,
  demandProfile: DemandProfileSchema,
  dataInventory: DataInventorySchema,
  asIsProcessAnalysis: AsIsProcessAnalysisSchema.optional(),
  stakeholderMap: StakeholderMapSchema,
});

export type Stage0 = z.infer<typeof Stage0Schema>;
export type AsIsProcessAnalysis = z.infer<typeof AsIsProcessAnalysisSchema>;

// ─── Stage 1 — Service Design ────────────────────────────────────────────────

export const DecompositionDecisionSchema = z.object({
  archetype: z.enum(['Capability', 'Composite', 'Orchestrating']),
  decisionDate: z.string().optional(),
  decisionMadeBy: z.string().optional(),
  smellTests: z.array(z.object({
    test: z.string(),
    result: z.enum(['pass', 'fail', 'n/a']),
    notes: z.string(),
  })).min(7),
  rationale: z.string(),
  calledServices: z.array(z.string()),
  decisionLog: z.array(z.object({
    decision: z.string(),
    date: z.string(),
    madeBy: z.string().optional(),
    rationale: z.string().optional(),
    reviewer: z.string(),
  })),
});

export const ServiceBoundarySchema = z.object({
  inputs: z.array(z.object({
    name: z.string(),
    format: z.string(),
    source: z.string(),
    from: z.string().optional(),
    frequency: z.string().optional(),
    validation: z.string().optional(),
  })),
  outputs: z.array(z.object({
    name: z.string(),
    format: z.string(),
    destination: z.string(),
    to: z.string().optional(),
    trigger: z.string().optional(),
    evidence: z.string().optional(),
  })),
  calledServices: z.array(z.object({
    service: z.string(),
    serviceId: z.string().optional(),
    serviceName: z.string().optional(),
    mode: z.string().optional(),
    cascadePattern: z.enum(['Sequential', 'Parallel', 'Pre-existing']),
    ola: z.string(),
  })),
});

export const ValueStreamSchema = z.array(z.object({
  phase: z.number(),
  name: z.string(),
  customerActivity: z.string(),
  serviceActivity: z.string(),
  stageOutcome: z.string().optional(),
  stageTimeTarget: z.string().optional(),
})).min(3).max(7);

export const SlaTargetSchema = z.array(z.object({
  tier: z.string(),
  cycleTimeTarget: z.string(),
  qualityTarget: z.string().optional(),
  availabilityTarget: z.string().optional(),
}));

export const OutcomeTargetsSchema = z.object({
  slaTargets: SlaTargetSchema.optional(),
  statedSlaDays: z.number(),
  computedSlaDays: z.number(),
  variance: z.number(),
  varianceJustification: z.string().optional(),
  olaBreakdown: z.array(z.object({
    service: z.string(),
    olaDays: z.number(),
    executionMode: z.enum(['Sequential', 'Parallel']),
    contributionToSla: z.string().optional(),
  })),
});

export const AuditDriversSchema = z.array(z.object({
  controlStep: z.string(),
  regulation: z.string(),
  evidenceRequired: z.string(),
  retentionDays: z.number(),
}));

export const LifecycleStageSchema = z.object({
  stage: z.enum(['Designing', 'Implementing', 'Operating', 'Optimizing', 'Deprecating', 'Retiring']),
  targetGoLive: z.string().optional(),
  stableOperationDate: z.string().optional(),
  deprecationPlan: z.string().optional(),
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

export const WorkflowShapeSchema = z.object({
  id: z.number().int().positive(),
  shapeType: z.enum(['Terminator', 'Process', 'Decision', 'Delay']),
  label: z.string().min(1).max(40),
  lane: z.number().int().min(1).max(6),
  taskTypeCode: z.string().optional(),
  moduleId: z.string().optional(),
  moduleName: z.string().optional(),
});

export const WorkflowConnectionSchema = z.object({
  id: z.number().int().positive(),
  source: z.number().int().positive(),
  destination: z.number().int().positive(),
  label: z.string().optional(),
});

export const WorkflowCsvSpecSchema = z.object({
  lanes: z.array(z.string().min(1).max(20)).min(2).max(6),
  shapes: z.array(WorkflowShapeSchema).min(5),
  connections: z.array(WorkflowConnectionSchema).min(4),
});

export type WorkflowCsvSpec = z.infer<typeof WorkflowCsvSpecSchema>;

export const ModuleRegisterSchema = z.array(z.object({
  moduleId: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string().optional(),
  coreOrElective: z.string().optional(),
  ola: z.string(),
  alignedSubflow: z.string(),
  subflowMaturity: z.enum(['Candidate', 'Provisional', 'Ratified', 'Stable', 'Deprecated']),
  digitizationTarget: z.string().optional(),
}));

export const TaskRegisterSchema = z.array(z.object({
  taskId: z.string(),
  moduleId: z.string(),
  name: z.string(),
  description: z.string(),
  taskTypeCode: z.string(),
  trigger: z.string().optional(),
  inputs: z.string().optional(),
  outputsEvidence: z.string().optional(),
  approverRole: z.string().optional(),
  businessRules: z.string().optional(),
  slaClockImpact: z.string().optional(),
  digitizationMode: z.enum(['automated', 'assisted', 'manual']),
  olaFull: z.string(),
  olaCompact: z.string(),
  capacityAssumption: z.string(),
  behaviourAboveBaseline: z.string().optional(),
  exceptionPath: z.string(),
  exceptionTrigger: z.string().optional(),
  automationCandidate: z.boolean(),
  lane: z.string(),
}));

export const LoopGovernanceSchema = z.array(z.object({
  loopId: z.string(),
  type: z.enum(['Resubmission', 'Rework', 'Negotiation', 'Iteration']),
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
  patternMaturity: z.string().optional(),
  wcpCode: z.string(),
  deviation: z.string().optional(),
}));

export const SeverityTierReconciliationSchema = z.array(z.object({
  tier: z.string(),
  statedSlaDays: z.number(),
  computedSlaDays: z.number(),
  variance: z.number(),
  varianceJustification: z.string().optional(),
  olaBreakdown: z.array(z.object({
    service: z.string(),
    olaDays: z.number(),
    executionMode: z.enum(['Sequential', 'Parallel']),
  })),
}));

export const PatternDriftNotesSchema = z.array(z.object({
  moduleId: z.string(),
  standardPattern: z.string(),
  deviation: z.string(),
  justification: z.string(),
  libraryUpdateRecommended: z.boolean(),
}));

export const WorkflowVariantSchema = z.object({
  tier: z.string().min(1),
  diagram: BpmnProcessSchema,
});

export const Stage2Schema = z.object({
  moduleRegister: ModuleRegisterSchema,
  taskRegister: TaskRegisterSchema,
  loopGovernance: LoopGovernanceSchema,
  workflowDiagram: BpmnProcessSchema,
  workflowVariants: z.array(WorkflowVariantSchema).optional(),
  subflowAlignment: SubflowAlignmentSchema,
  workflowCsvSpec: WorkflowCsvSpecSchema.optional(),
  severityTierReconciliation: SeverityTierReconciliationSchema.optional(),
  patternDriftNotes: PatternDriftNotesSchema.optional(),
});

export type Stage2 = z.infer<typeof Stage2Schema>;
export type WorkflowVariant = z.infer<typeof WorkflowVariantSchema>;
export type SeverityTierReconciliation = z.infer<typeof SeverityTierReconciliationSchema>;
export type PatternDriftNotes = z.infer<typeof PatternDriftNotesSchema>;

// ─── Stage 3 — Build-Ready Requirements ──────────────────────────────────────

export const DataContractSchema = z.array(z.object({
  name: z.string(),
  direction: z.enum(['Inbound', 'Outbound']),
  schemaDescription: z.string(),
  mandatoryFields: z.array(z.string()),
  optionalFields: z.array(z.string()),
  versioningStrategy: z.string(),
  schemaReference: z.string().optional(),
  notes: z.string().optional(),
}));

export const IntegrationPointSchema = z.array(z.object({
  system: z.string(),
  direction: z.enum(['Outbound', 'Inbound', 'Bidirectional']),
  protocol: z.string(),
  frequency: z.string(),
  authentication: z.string(),
  fallbackBehavior: z.string(),
  rateLimits: z.string().optional(),
  slaDependency: z.string().optional(),
}));

export const AutomationCandidateSchema = z.array(z.object({
  taskId: z.string(),
  automationMode: z.string(),
  buildApproach: z.string(),
  prerequisites: z.array(z.string()),
  phase: z.enum(['Phase 1', 'Phase 2']),
  estimatedEffort: z.string().optional(),
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

export const AppendixASchema = z.array(z.object({
  date: z.string(),
  decision: z.string(),
  madeBy: z.string().optional(),
  rationale: z.string().optional(),
  reviewer: z.string().optional(),
}));

export const AppendixBSchema = z.array(z.object({
  scenario: z.string(),
  description: z.string(),
  loadMultiplier: z.string().optional(),
  expectedImpact: z.string().optional(),
  mitigationStrategy: z.string().optional(),
}));

export const AppendixCSchema = z.array(z.object({
  regulation: z.string(),
  citation: z.string().optional(),
  article: z.string().optional(),
  applicability: z.string(),
  controlSection: z.string().optional(),
}));

export const AppendixDSchema = z.array(z.object({
  version: z.string(),
  date: z.string(),
  changedBy: z.string(),
  description: z.string(),
}));

export const ServiceFamilyIndexSchema = z.array(z.object({
  serviceId: z.string(),
  serviceName: z.string(),
  archetype: z.string(),
  calls: z.array(z.string()),
  calledBy: z.array(z.string()),
  slaTarget: z.string(),
  manifestReference: z.string().optional(),
}));

export const ServiceDependencyManifestSchema = z.array(z.object({
  caller: z.string(),
  called: z.string(),
  cascadePattern: z.string(),
  impactIfChanged: z.string(),
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
  serviceFamilyIndex: ServiceFamilyIndexSchema.optional(),
  serviceDependencyManifest: ServiceDependencyManifestSchema.optional(),
  appendixA: AppendixASchema.optional(),
  appendixB: AppendixBSchema.optional(),
  appendixC: AppendixCSchema.optional(),
  appendixD: AppendixDSchema.optional(),
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

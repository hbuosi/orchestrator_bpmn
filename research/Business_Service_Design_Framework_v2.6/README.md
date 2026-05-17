# Business Service Design Framework v2.6

## What This Is

A methodology framework for designing business services — Capability, Composite, and Orchestrating archetypes — with emphasis on:
- **Decomposition discipline** (right-sized services, right archetypes)
- **Operational truth** (OLAs that match SLAs that match capacity)
- **Stakeholder readiness** (designs that land with the right audiences)
- **Portfolio coherence** (services that compose, evolve, and scale together)

## What v2.6 Changed

v2.6 is a substantial restructure. Three architectural moves drive everything else:

### 1. Single Service Manifest as Source of Truth

In v2.5 and earlier, services produced 4–7 separate documents (Service Card, Intake Form, Blueprint, Task Model, BRD, Subflow Map…) with significant content overlap. Same data lived in 3–4 places, and they often disagreed.

In v2.6, a **single Service Manifest (.docx)** is the source of truth. Each stage adds sections to the same manifest. Other artifacts (Workflow CSV, Module Register, Task Register) are rendered from the manifest, not authored separately.

### 2. Compressed Stage Model: 5 Stages → 4

| v2.5 | v2.6 |
|---|---|
| Stage 0 — Discovery (Service Card + Intake) | Stage 0 — **Service Definition** (Manifest §1–7) |
| Stage 1 — Business Blueprint | Stage 1 — **Service Design** (Manifest §8–13) |
| Stage 2 — Task Model & Workflow | Stage 2 — **Task Model & Workflow** (Manifest §14–22) |
| Stage 2.5 — Subflow Alignment | **Merged into Stage 2** as Section 21 |
| Stage 3 — Business Requirements | Stage 3 — **Build-Ready Requirements** (Manifest §23–27) |

### 3. Methodology Improvements (All Tier 1–4 from v2.6 design analysis)

| Improvement | Where it lives in v2.6 |
|---|---|
| Reuse-First moved to Stage 0 | Manifest §3 (mandatory ≥3 searches) |
| Capability Catalogue Index | New shared artifact |
| Customer Journey Context as required | Manifest §2 |
| Demand & Capacity Profile | Manifest §4 |
| Data Inventory | Manifest §6 |
| Stakeholder & Persona Map | Manifest §7 |
| Decomposition Decision with smell tests | Manifest §8 |
| Decomposition Decision Log | Manifest §8.3 |
| Service Boundary Smell Tests | New shared artifact |
| Capability Service Skeleton (9-stage template) | New shared artifact |
| SLA Cascade Reconciliation | Manifest §11.2 |
| Audit & Regulatory Drivers | Manifest §12 |
| Service Lifecycle Stage | Manifest §13 |
| OLA-to-SLA Arithmetic | SLA Cascade Methodology |
| Loop Governance (every loop) | Manifest §16 |
| Exception Pathway Audit (every task) | Manifest §17 |
| Capacity Assumptions (every OLA) | Manifest §18 |
| Severity-Tier Reconciliation | Manifest §19 |
| Subflow Alignment | Manifest §21 (was Stage 2.5) |
| Pattern Drift Notes | Manifest §22 |
| Subflow Maturity Lifecycle | New shared artifact |
| Build-Ready Handoff (data contracts, integrations) | Manifest §23 |
| KPI Inheritance | Manifest §24 |
| Service Family Index | Manifest §28 |
| Service Dependency Manifest | Manifest §29 |

## Why This Helps

| Your goal | How v2.6 delivers |
|---|---|
| Better business requirements | Manifest forces structured definition; ambiguous fields can't pass schema |
| Leverage Opus 4.7 improvements | Single-pass manifest authoring uses 4.7's longer context + structured output |
| Better, more understandable designs | Manifest sections give each audience a defined view |
| Lean | One manifest replaces 4–7 overlapping documents |
| Reduce errors | Schema-bound output + leaner prompts eliminate the "did the LLM miss a column" class of errors |
| Consistency | Same manifest schema for every service |
| Efficiency | Designer authors once; system renders many |

## Mandatory Outputs Per Service

| Stage | Output | Format |
|---|---|---|
| Stage 0 | Service Manifest §1–7 | `.docx` |
| Stage 1 | Service Manifest §8–13 (extending) | `.docx` |
| Stage 2 | Service Manifest §14–22 + Workflow CSV | `.docx` + `.csv` |
| Stage 3 | Service Manifest §23–27 (extending) | `.docx` |

For service families (composite + capabilities):
- One Manifest per service in the family
- Service Family Index (Section 28 of orchestrator/composite manifest)

## Stage Model

| Stage | Name | Deliverable | Manifest Sections |
|---|---|---|---|
| 0 | Service Definition | Manifest §1–7 | Identification, Journey, Reuse, Demand, Data, Personas |
| 1 | Service Design | Manifest §8–13 | Decomposition, Boundary, Value Stream, Outcomes, Audit, Lifecycle |
| 2 | Task Model & Workflow | Manifest §14–22 + CSV | Modules, Tasks, Loops, Exceptions, Capacity, Tiers, Diagram, Subflow, Drift |
| 3 | Build-Ready Requirements | Manifest §23–27 | Handoff, KPIs, Operating Model, Acceptance, Risks |

## Theoretical Grounding

Unchanged from v2.5. Operates at the intersection of:
- Service-Oriented Architecture (Erl)
- Domain-Driven Design (Evans, Khononov)
- Business Process Management (Dumas, Van der Aalst)
- Composable Enterprise (Gartner PBCs)

The Standard Subflow Library is empirically derived; WCP annotations provide structural traceability.

## Migration from v2.5

See `MIGRATION_v2.5_to_v2.6.md` for the migration guide. Headline:
- Existing v2.5 documents (Service Card, Blueprint, Task Model) can be consolidated into the manifest as a one-time migration
- Existing Workflow CSVs (v2.5 compliant) carry forward unchanged
- Migration takes ~2 hours per service

## Examples

`Examples/VND-FAM-001/` contains a complete worked example: a composite service (Vendor Onboarding Package) with 5 capability services, demonstrating the v2.6 manifest pattern, family bundling, and SLA cascade arithmetic.

## File Inventory

```
Business_Service_Design_Framework_v2.6/
├── README.md
├── QUICKSTART.md
├── MIGRATION_v2.5_to_v2.6.md
├── Templates/
│   └── Service_Manifest_Template_v1.0.docx       ← THE central artifact
├── Shared/
│   ├── Capability_Catalogue_Index_v1.0.csv
│   ├── Capability_Service_Skeleton_v1.0.md
│   ├── Decomposition_Smell_Tests_v1.0.md
│   ├── Loop_Governance_Schema_v1.0.md
│   ├── SLA_Cascade_Methodology_v1.0.md
│   ├── Subflow_Maturity_Lifecycle_v1.0.md
│   ├── Build_Ready_Handoff_Schema_v1.0.md
│   ├── Diagram_Quality_Checklist_v1.1.md
│   ├── Business_Task_Flow_Export_Guide_v1.7.md
│   ├── Business_Task_Flow_Export_Template_v1.5.csv
│   ├── Standard_Subflow_Library_v1.0.xlsx
│   ├── Business_Task_Library_v1.5.xlsx
│   ├── Control_Flow_Pattern_Reference_v1.0.md
│   ├── Minimum_Viable_Decomposition_Rules_v1.3.md
│   ├── Consolidation_Pass_Protocol_v1.0.md
│   ├── Gap_Anticipation_Checklist_v1.0.md
│   ├── Service_Family_Index_Template_v1.csv
│   ├── Service_Family_Edge_List_Template_v1.csv
│   ├── Service_Family_Membership_Template_v1.csv
│   ├── Service_Family_Signoff_Index_Template_v1.csv
│   ├── Variant_Ledger_Template_v1.csv
│   └── Change_Impact_Matrix_Template_v1.csv
├── Stage_0_Service_Definition/
│   ├── Service_Definition_Prompt_v3.0.md
│   └── STAGE_GUIDE.md
├── Stage_1_Service_Design/
│   ├── Service_Design_Prompt_v3.0.md
│   └── STAGE_GUIDE.md
├── Stage_2_Task_Model_and_Workflow/
│   ├── Task_Model_and_Workflow_Prompt_v3.0.md
│   └── STAGE_GUIDE.md
├── Stage_3_Build_Ready_Requirements/
│   ├── Build_Ready_Requirements_Prompt_v3.0.md
│   └── STAGE_GUIDE.md
└── Examples/
    └── VND-FAM-001/    ← canonical worked example
```

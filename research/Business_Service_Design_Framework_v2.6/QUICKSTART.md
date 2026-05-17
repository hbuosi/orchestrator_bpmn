# Quickstart — Service Design Framework v2.6

## What Changed in v2.6

- One Service Manifest (`.docx`) per service, replacing 4–7 separate documents
- 4 stages instead of 5 (Subflow Alignment merged into Stage 2)
- Reuse-First search moved to Stage 0 (was implicit in v2.5)
- SLA Cascade arithmetic mandatory at Stage 1
- Loop governance, exception pathways, and capacity assumptions mandatory at Stage 2

## Per-Service Execution Sequence

### Stage 0 — Service Definition

1. Copy `Templates/Service_Manifest_Template_v1.0.docx` to `[ServiceID]_Manifest.docx`
2. Upload `Stage_0_Service_Definition/Service_Definition_Prompt_v3.0.md`
3. Upload the manifest, the Capability Catalogue Index, and supporting materials
4. Output: Manifest with Sections 1–7 complete
5. **Review gate:** Service Owner signs off on Section 1; Capability Librarian confirms reuse search

### Stage 1 — Service Design

1. Upload `Stage_1_Service_Design/Service_Design_Prompt_v3.0.md`
2. Upload the manifest (Stage 0 complete) plus shared methodology files
3. Output: Manifest extended with Sections 8–13
4. **Review gate:** Service Owner signs off on archetype + SLA; Architecture confirms decomposition

### Stage 2 — Task Model & Workflow

1. Upload `Stage_2_Task_Model_and_Workflow/Task_Model_and_Workflow_Prompt_v3.0.md`
2. Upload the manifest (Stages 0+1 complete), Business Task Library, Standard Subflow Library, Diagram Quality Checklist, Loop Governance Schema, Subflow Maturity Lifecycle
3. If Capability: also upload Capability Service Skeleton
4. Output: Manifest extended with Sections 14–22 + Workflow CSV
5. **Review gate:** Process Owner confirms operational viability; Library Curator validates Section 21; CSV imports cleanly to Lucidchart

### Stage 3 — Build-Ready Requirements

1. Upload `Stage_3_Build_Ready_Requirements/Build_Ready_Requirements_Prompt_v3.0.md`
2. Upload the manifest (Stages 0+1+2 complete) + Build-Ready Handoff Schema
3. Output: Manifest extended with Sections 23–27
4. **Review gate:** Service Owner final sign-off; Build Team confirms Section 23 sufficient for estimation

## Family-Level Activities (Composite + Capabilities)

For service families:
1. Complete Stages 0–3 for the composite/orchestrator service
2. Complete Stages 0–3 for each capability service in the family
3. Populate Section 28 (Service Family Index) on the composite/orchestrator's manifest
4. Populate Section 29 (Service Dependency Manifest) showing edges
5. Bundle all manifests + Workflow CSVs into a Service Family Bundle (zip)

See `Examples/VND-FAM-001/` for a worked example.

## Stage Gates Summary

| Stage | Entry Gate | Exit Gate |
|---|---|---|
| 0 | Selected service row | Sections 1–7 complete; SO signs §1 |
| 1 | Stage 0 complete | Sections 8–13 complete; SO signs archetype + SLA |
| 2 | Stage 1 complete | Sections 14–22 complete; CSV passes 12 rules |
| 3 | Stage 2 complete | Sections 23–27 complete; build team confirms §23 |

## Common Pitfalls

| Pitfall | Avoid by |
|---|---|
| Skipping reuse search | Section 3 mandatory ≥3 searches |
| Wrong archetype | Apply all 7 smell tests in Section 8.2 |
| SLA doesn't reconcile to OLAs | Section 11.2 cascade arithmetic |
| Loops without governance | Section 16 mandatory per loop |
| Tasks without exception path | Section 17 mandatory per task |
| Diagram exceeds 25 shapes | Apply Diagram Quality Rules; compress modules |
| BRD restates earlier content | Stage 3 is additive only |

## When to Use What

| Need | File |
|---|---|
| Author a new service | Stage 0 prompt + Manifest template |
| Decide archetype | Decomposition Smell Tests |
| Calculate SLA cascade | SLA Cascade Methodology |
| Design a capability | Capability Service Skeleton |
| Govern loops | Loop Governance Schema |
| Validate workflow CSV | Diagram Quality Checklist |
| Align with subflow library | Standard Subflow Library + Subflow Maturity Lifecycle |
| Build handoff | Build-Ready Handoff Schema |
| Migrate from v2.5 | Migration guide |

## File Locations

- Templates: `Templates/`
- Methodology references: `Shared/`
- Stage prompts: `Stage_N_*/Service_*_Prompt_v3.0.md`
- Stage execution guides: `Stage_N_*/STAGE_GUIDE.md`
- Worked examples: `Examples/`

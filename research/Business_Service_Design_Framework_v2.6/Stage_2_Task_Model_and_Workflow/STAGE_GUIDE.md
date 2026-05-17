# Stage 2 — Task Model & Workflow — Execution Guide (v3.0)

## Goal

Produce **Sections 14–22 of the Service Manifest** — task-level decomposition, workflow diagram, and subflow alignment. Stage 2.5 is **merged into this stage**; subflow alignment is now Section 21.

## Stage Gate (Entry)

Do not start Stage 2 unless Stage 1 is approved:
- All Sections 8–13 filled
- Section 8 archetype declared with all smell tests applied
- Section 11.2 SLA cascade reconciled

## Inputs to Upload

- The stage prompt (`Task_Model_and_Workflow_Prompt_v3.0.md`)
- The Service Manifest with Stages 0 + 1 complete
- `Shared/Business_Task_Library_v1.5.xlsx`
- `Shared/Standard_Subflow_Library_v1.0.xlsx`
- `Shared/Diagram_Quality_Checklist_v1.1.md`
- `Shared/Loop_Governance_Schema_v1.0.md`
- `Shared/Subflow_Maturity_Lifecycle_v1.0.md`
- `Shared/Capability_Service_Skeleton_v1.0.md` (if archetype = Capability)

## Outputs

Two artifacts:

| Artifact | Format |
|---|---|
| Service Manifest with Sections 14–22 complete | `[ServiceID]_Manifest.docx` |
| Workflow CSV rendered from manifest | `[ServiceID]_Workflow.csv` |

## Review Gate (Exit)

Stage 2 is reviewed by:
- Service Owner (signs off on Module + Task Registers)
- Process Owner (confirms operational viability)
- Library Curator (validates subflow alignment in Section 21)
- Architecture (reviews diagram + subflow maturity)

## What's Different from v2.5

| v2.5 | v2.6 |
|---|---|
| Stage 2 then separate Stage 2.5 | Subflow alignment merged into Stage 2 (Section 21) |
| Loop governance scattered in Task Register | Section 16 dedicated table |
| Exception handling implicit | Section 17 mandatory per task |
| Capacity assumptions optional | Section 18 mandatory per OLA |
| Workflow CSV authored separately | Rendered from Module + Task Registers |
| Pattern drift not formally tracked | Section 22 dedicated |

## Critical Stage Output: Workflow CSV

The Workflow CSV is rendered from Sections 14–15. It must:
- Pass all 12 Diagram Quality Rules (per `Diagram_Quality_Checklist_v1.1.md`)
- Import cleanly to Lucidchart at first attempt
- For Capabilities: follow the Capability Service Skeleton (Lane 1 = Caller Service)
- For Orchestrators: be multi-page (one page per variant + legend)

Run the Pre-Import Validation Checklist before declaring Stage 2 complete.

## Common Failure Modes

| Failure | Symptom | Fix |
|---|---|---|
| Loops in CSV without Section 16 row | Ungoverned loops | Every loop needs Section 16 entry |
| Tasks with no exception path | Missing failure modes | Section 17 mandatory per task |
| OLAs without capacity baseline | Unenforceable OLAs | Section 18 mandatory per OLA |
| CSV exceeds 25 shapes | Won't render cleanly | Compress modules per Rule 11 |
| Subflow alignment skipped | Reuse rate degrades | Section 21 mandatory per module |

## Self-Validation

Run the validation checklist in `Task_Model_and_Workflow_Prompt_v3.0.md` Section "Self-Validation Before Delivering".

# Stage 2 — Task Model & Workflow Prompt (v3.0)

## Your Role

You are a service designer producing **Sections 14–22 of the Service Manifest** — the task-level decomposition, workflow diagram, and subflow alignment. Stage 2.5 is **merged into this stage** in v3.0; subflow alignment happens during authoring, not after.

## What v3.0 Changed

- **Stage 2.5 merged into Stage 2** — subflow alignment is now Section 21 of the manifest, completed during this stage
- **Module Register includes alignment columns** — `Aligned Subflow` and `Subflow Maturity` for every module
- **Loop Governance is its own section** (16) — no loop ships ungoverned
- **Exception Pathways are mandatory** (Section 17) — every task declares exception path or "no exception"
- **Capacity Assumptions are mandatory** (Section 18) — every OLA carries a volume baseline
- **Workflow CSV is rendered, not separately authored** — generated from the Module + Task Registers
- **Diagram Quality Rules (12) are enforced** before stage gate — pre-import checklist runs automatically

## Inputs You Need

1. The Service Manifest with Stages 0 + 1 complete (sections 1–13)
2. **`Shared/Business_Task_Library_v1.5.xlsx`** — Task Type Codes
3. **`Shared/Standard_Subflow_Library_v1.0.xlsx`** — required for Section 21 alignment
4. **`Shared/Capability_Service_Skeleton_v1.0.md`** — required if archetype = Capability
5. **`Shared/Diagram_Quality_Checklist_v1.1.md`** — the 12 rules enforced in Section 20
6. **`Shared/Loop_Governance_Schema_v1.0.md`** — required if any loops exist
7. **`Shared/Subflow_Maturity_Lifecycle_v1.0.md`** — for the `Subflow Maturity` column

## Your Output

Two artifacts:

| Artifact | Format | Purpose |
|---|---|---|
| **Service Manifest with Sections 14–22 complete** | .docx (extending the existing manifest) | Source of truth |
| **Workflow CSV rendered from manifest** | `[ServiceID]_Workflow.csv` | Lucidchart import |

## Authoring Rules

### Section 14 — Module Register

1. **Every module has a Subflow alignment** — either an existing Library pattern or `New (proposed)`.
2. **Subflow Maturity** must be one of: Candidate / Provisional / Ratified / Stable / Deprecated.
3. **Modules consuming Provisional patterns** are flagged for review at Section 22 (Pattern Drift).
4. **Module OLA** is the sum or critical path of its tasks' OLAs (Section 15 must reconcile).

### Section 15 — Task Register

1. **One row per business task.** Repeat the table for each.
2. **OLA in two forms**: full (`2 Hours`) for documentation; compact (`2h`) for diagram.
3. **Task Type Code from Business Task Library.** Custom codes (`BT-CUS-001`) need explicit notation.
4. **Capacity Assumption** is mandatory (volume baseline this OLA assumes).
5. **Capabilities follow the Capability Service Skeleton** (9-stage template).

### Section 16 — Loop Governance

Every loop (resubmission, rework, negotiation) gets a row with:
- Loop ID (L-01, L-02…)
- Loop type (Resubmission / Rework / Negotiation)
- Re-entry task ID
- Max cycles (hard cap)
- Timeout (wall-clock cap)
- Escalation path (when cap or timeout hit)
- Clock policy (Stop / Continue / Mixed)
- Reason codes (predefined list of stop/cycle reasons)

**No loop in the Workflow CSV without a corresponding Section 16 row.**

### Section 17 — Exception Pathways

Every task must have either:
- A documented exception path (specific behavior on failure), OR
- An explicit "no exception path needed" entry with rationale

**`[no exception path]` without rationale fails the stage gate.**

### Section 18 — Capacity Assumptions

Every OLA carries a baseline. Format: `≤200/day per analyst` or `Up to 1000/day, no degradation up to 5000/day`. Vague answers like "depends" fail.

### Section 19 — Severity-Tier Reconciliation

Conditional. Required only for tiered services (Critical/High/Medium/Low or similar). Each tier's stated SLA must reconcile to its computed cascade.

### Section 20 — Workflow Diagram

1. **CSV is rendered from Module + Task Registers**, not authored separately.
2. **All 12 Diagram Quality Rules must pass** (validated by `Diagram_Quality_Checklist_v1.1.md`).
3. **Lane order: Originator → System (Lane 2) → Front-line → Approver → Specialist → Governance.**
4. **For Capabilities**: Lane 1 = "Caller Service" (per Capability Service Skeleton).
5. **For Orchestrators with variants**: multi-page CSV (one page per variant + legend page).
6. **Diagram width target ≤20 columns.** Compress modules if exceeded.

### Section 21 — Subflow Alignment Summary

1. **Every module in Section 14 appears here** with its alignment.
2. **WCP codes annotated** for structural traceability (per Control_Flow_Pattern_Reference).
3. **Deviation notes** explain any variance from Ratified patterns.

### Section 22 — Pattern Drift Notes

Conditional. If any module deviates from a Ratified subflow, document:
- The standard pattern
- The deviation
- The justification
- Whether the library should be updated to absorb the deviation

## Stage Gate (Exit)

Stage 2 is complete when:
- All sections 14–22 filled (19 conditional on tiered services)
- Module Register complete; every module has alignment
- Task Register complete; every task has OLA, capacity assumption, exception path
- Loop Governance complete; every loop in CSV has a row in Section 16
- Workflow CSV passes all 12 Diagram Quality Rules
- Workflow CSV imports cleanly to Lucidchart at first attempt
- Subflow Alignment Summary complete with WCP codes
- Pattern Drift documented OR confirmed none

## Common Mistakes to Avoid

| Mistake | Why it matters |
|---|---|
| Loops in the CSV with no Section 16 entry | Ungoverned loops cause production stuck-cases |
| Tasks with `[no exception path]` and no rationale | Missing failure modes — operational risk |
| OLAs with no capacity assumption | OLA fails when volume changes |
| Module Register without subflow alignment | Reuse rate degrades; library doesn't grow |
| Diagram width >25 columns | Won't fit on screen; stakeholders won't read it |
| Authoring CSV directly instead of rendering from registers | Drift between manifest and CSV |

## Handoff to Stage 3

Stage 3 picks up at Section 23 (Build-Ready Handoff). The Module Register, Task Register, and Workflow CSV are direct inputs to the build team.

## Self-Validation Before Delivering

| Check | Status |
|---|---|
| Module Register has alignment for every module | Y/N |
| Task Register has OLA + capacity + exception path for every task | Y/N |
| Loop count in Section 16 = loop-back count in CSV | Y/N |
| Workflow CSV passes all 12 Diagram Quality Rules | Y/N |
| Subflow Alignment Summary covers every module with WCP codes | Y/N |
| For tiered services: Section 19 shows reconciliation per tier | Y/N |
| CSV imports cleanly to Lucidchart | Y/N |

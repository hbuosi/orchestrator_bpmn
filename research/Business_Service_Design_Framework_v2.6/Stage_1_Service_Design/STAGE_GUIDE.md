# Stage 1 — Service Design — Execution Guide (v3.0)

## Goal

Produce **Sections 8–13 of the Service Manifest** — the design framing, decomposition decision, and outcome targets. The decomposition decision is the most consequential output of this stage.

## Stage Gate (Entry)

Do not start Stage 1 unless Stage 0 is approved:
- All Required sections (1, 2, 3, 4, 6, 7) filled
- Service Owner sign-off on Section 1

## Inputs to Upload

- The stage prompt (`Service_Design_Prompt_v3.0.md`)
- The Service Manifest with Stage 0 complete
- `Shared/Decomposition_Smell_Tests_v1.0.md`
- `Shared/Minimum_Viable_Decomposition_Rules_v1.3.md`
- `Shared/SLA_Cascade_Methodology_v1.0.md`
- `Shared/Capability_Service_Skeleton_v1.0.md` (if archetype = Capability)

## Output

The same Service Manifest extended with Sections 8–13 complete:
- File: `[ServiceID]_Manifest.docx` (updated)
- Status: Stage 1 complete

## Review Gate (Exit)

Stage 1 is reviewed by:
- Service Owner (signs off on archetype + SLA target)
- Architecture / Service Design Lead (confirms decomposition + smell tests)
- Compliance / Risk (reviews Section 12 Audit & Regulatory)

## What's Different from v2.5

| v2.5 | v2.6 |
|---|---|
| Blueprint document (.docx) | Manifest sections 8–13 |
| Decomposition was implicit | Explicit Section 8 with smell tests |
| SLA reconciliation often skipped | Section 11.2 cascade arithmetic mandatory |
| Audit drivers added at BRD stage | Section 12 captured at design |
| Lifecycle stage not tracked | Section 13 mandatory |

## Common Failure Modes

| Failure | Symptom | Fix |
|---|---|---|
| Wrong archetype | Sections 14+ contradict the declared archetype | Apply all 7 smell tests; revise if any fail |
| SLA variance unjustified | Math doesn't reconcile to stated SLA | Either revise stated SLA or document acceptable justification |
| Audit drivers vague | "Approved per policy" instead of specific control | Force specific evidence requirements |
| Lifecycle stage skipped | Annual review never scheduled | Section 13 forces scheduling |

## Self-Validation

Run the validation checklist in `Service_Design_Prompt_v3.0.md` Section "Self-Validation Before Delivering".

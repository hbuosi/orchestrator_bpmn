# Stage 3 — Build-Ready Requirements — Execution Guide (v3.0)

## Goal

Produce **Sections 23–27 of the Service Manifest** — the build-ready handoff to system design and build teams. v3.0 reframes the BRD as the **incremental** document — adds what wasn't in earlier stages and is essential to build.

## Stage Gate (Entry)

Do not start Stage 3 unless Stage 2 is approved:
- All Sections 14–22 filled
- Workflow CSV passes all 12 Diagram Quality Rules

## Inputs to Upload

- The stage prompt (`Build_Ready_Requirements_Prompt_v3.0.md`)
- The Service Manifest with Stages 0 + 1 + 2 complete
- Workflow CSV (already validated)
- `Shared/Build_Ready_Handoff_Schema_v1.0.md`

## Output

The Service Manifest extended with Sections 23–27 complete:
- File: `[ServiceID]_Manifest.docx` (final)
- Status: Stage 3 complete; service ready for build

## Review Gate (Exit)

Stage 3 is reviewed by:
- Service Owner (final sign-off; KPI definitions)
- Build Team Representative (confirms Section 23 sufficient for estimation)
- Service Sponsor (final commitment)

## What's Different from v2.5

| v2.5 | v2.6 |
|---|---|
| BRD .docx (often re-stated content) | Manifest sections 23–27 (additive only) |
| ~12 BRD sections | 5 manifest sections |
| Acceptance criteria narrative | Testable criteria with thresholds |
| KPI roll-up implicit | Section 24 explicit parent/child mapping |
| Open questions tracked separately | Section 27 in manifest |

## What Stage 3 Does NOT Repeat

Build teams have access to the manifest. Stage 3 should not restate:
- Service purpose, boundary, owner (already in Section 1)
- Customer journey (Section 2)
- Demand profile (Section 4)
- Decomposition decision (Section 8)
- Module/Task Registers (Sections 14–15)
- Workflow CSV (Section 20)

Stage 3 adds:
- Data contracts and integration points (Section 23)
- KPI parent/child mapping (Section 24)
- Operating model RACI + cadence (Section 25)
- Testable acceptance criteria (Section 26)
- Outstanding risks/questions (Section 27)

## Common Failure Modes

| Failure | Symptom | Fix |
|---|---|---|
| Restating Service Card | Build team skips the document | Stage 3 is additive only |
| Untestable acceptance criteria | Go-live becomes subjective | Each criterion needs threshold |
| Missing integration auth detail | Build blocks at integration sprint | Section 23.2 must specify auth |
| KPIs without parent/child | Portfolio dashboards don't aggregate | Section 24 maps both directions |
| Open questions left unowned | Risks become incidents post-go-live | Section 27 owner mandatory |

## Self-Validation

Run the validation checklist in `Build_Ready_Requirements_Prompt_v3.0.md` Section "Self-Validation Before Delivering".

## Handoff to System Design

After Stage 3, the complete Service Manifest is the input to system implementation. The system designer reads:
- Section 8 (archetype) — drives system pattern
- Sections 14–15 (registers) — drives platform tables, scripts, flows
- Section 20 (Workflow CSV) — drives platform workflow design
- Section 21 (Subflow Alignment) — drives platform subflow reuse
- Section 23 (data contracts) — drives schema and integration design
- Section 24 (KPIs) — drives reporting requirements
- Section 26 (acceptance) — drives test plan

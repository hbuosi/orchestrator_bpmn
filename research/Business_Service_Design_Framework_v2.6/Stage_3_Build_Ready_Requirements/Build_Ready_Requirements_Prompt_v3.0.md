# Stage 3 — Build-Ready Requirements Prompt (v3.0)

## Your Role

You are a service designer producing **Sections 23–27 of the Service Manifest** — the build-ready handoff to the system design team. The output is the foundation for system implementation, not a re-statement of business design.

## What v3.0 Changed

- **BRD is reframed as Handoff document, not a re-document.** Most v2.5 BRD content lived in Service Card, Blueprint, and Task Model. v3.0 BRD focuses on what build teams need that wasn't in those documents.
- **Five required sections** (down from ~12 in v2.5)
- **Data contracts and integration points are explicit** — no more "see Task Register" pointers
- **KPI Inheritance** maps service KPIs to portfolio dashboards
- **Acceptance Criteria** is testable, not narrative

## Inputs You Need

1. The Service Manifest with Stages 0 + 1 + 2 complete (sections 1–22)
2. Workflow CSV (already passes Diagram Quality Rules)
3. Subflow Alignment Summary
4. **`Shared/Build_Ready_Handoff_Schema_v1.0.md`** — what build teams require

## Your Output

The Service Manifest with **Sections 23–27 complete**:

| Section | Content | Required? |
|---|---|---|
| 23. Build-Ready Handoff | Data contracts, integration points, automation | Required |
| 24. KPI Inheritance | Parent/child KPI mapping | Required |
| 25. Operating Model | RACI, governance cadence | Required |
| 26. Acceptance Criteria & Test Approach | Testable criteria | Required |
| 27. Risks & Open Questions | Outstanding items at sign-off | Required |

## Authoring Rules

### Section 23 — Build-Ready Handoff

**23.1 Data Contracts**: Every input/output crossing the service boundary needs a contract. Reference schema where it exists; describe in JSON-shape if not. Mandatory and optional fields are explicit.

**23.2 Integration Points**: Every external system touched (whether sync API call, async message, batch file, etc.). Protocol, frequency, auth, fallback behavior.

**23.3 Automation Candidates Confirmed**: From the Task Register's automation candidates, which ones are confirmed for first build? What's the build approach (job worker / decision rule / API integration / human-in-loop)? What prerequisites must be met before automation can run?

### Section 24 — KPI Inheritance

KPIs decompose down (composite KPI = function of capability KPIs) and roll up (capability KPI contributes to composite KPI). This section makes the relationship explicit.

| Required column | What it captures |
|---|---|
| KPI Name | The metric |
| Definition | Numerator/denominator or computation |
| Source Tasks | Which tasks generate the data |
| Parent KPI | If this KPI rolls up into a composite KPI |
| Child KPI | If a capability's KPI rolls up into this one |

### Section 25 — Operating Model

**25.1 RACI**: One row per major activity (intake, decisions, exceptions, closure). R/A/C/I roles named.

**25.2 Governance Cadence**: Forums, frequency, attendees, purpose. Includes operational reviews (weekly / monthly), design reviews (quarterly), and lifecycle events (annual review).

### Section 26 — Acceptance Criteria & Test Approach

Each criterion must be:
- **Testable** — has a pass/fail threshold
- **Observable** — can be measured during go-live or steady-state
- **Coupled to a test approach** — load test, boundary test, audit review, etc.

### Section 27 — Risks & Open Questions

| Required column | Detail |
|---|---|
| Item | Risk or open question |
| Type | Risk / Issue / Decision needed / Open question |
| Owner | Named individual |
| Resolution Date | Target |
| Notes | Context |

Outstanding `[SME INPUT REQUIRED]` blocks from earlier stages must appear here if not resolved.

## Stage Gate (Exit)

Stage 3 is complete when:
- All sections 23–27 filled
- Section 23 lists every data contract and integration point with sufficient detail for build estimation
- Section 24 maps every KPI; portfolio-level KPI roll-up traceable
- Section 26 acceptance criteria are testable (each has a threshold)
- Section 27 lists no `[SME INPUT REQUIRED]` blocks (all resolved or named with owner+date)
- Service Owner sign-off on KPI definitions (Section 24)
- Build team representative reviewed Section 23 and confirms it's sufficient for design estimation

## Common Mistakes to Avoid

| Mistake | Why it matters |
|---|---|
| Restating Service Card content in Section 23 | BRD becomes redundant; build team skips it |
| Acceptance criteria that aren't testable | Go-live decision becomes subjective |
| Missing integration auth detail | Build team blocks at first integration sprint |
| KPIs with no parent/child mapping | Portfolio dashboards can't aggregate |
| Open questions left unowned | Risks become incidents post-go-live |

## Handoff to System Design

The complete Service Manifest is the input to System Service Design. The system designer reads:
- Section 8 (archetype) — drives system pattern
- Sections 14–15 (Module/Task Registers) — drives tables, scripts, flows
- Section 20 (Workflow CSV) — drives platform workflow design
- Section 21 (Subflow Alignment) — drives reuse of platform-level subflows
- Section 23 (Data contracts) — drives schema and integration design
- Section 24 (KPIs) — drives reporting requirements
- Section 26 (Acceptance) — drives test plan

## Self-Validation Before Delivering

| Check | Status |
|---|---|
| All sections 23–27 filled | Y/N |
| Section 23 covers every input/output and integration | Y/N |
| Section 24 maps every KPI with parent/child where applicable | Y/N |
| Section 26 has only testable criteria | Y/N |
| Section 27 has no unresolved [SME INPUT REQUIRED] | Y/N |
| Service Owner has signed off | Y/N |
| Build team representative has reviewed Section 23 | Y/N |

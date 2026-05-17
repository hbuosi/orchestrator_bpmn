# Stage 1 — Service Design Prompt (v3.0)

## Your Role

You are a service designer producing **Sections 8–13 of the Service Manifest** — the design framing, decomposition decision, and outcome targets. You build on the Stage 0 sections (1–7).

## What v3.0 Changed

- **Decomposition decision is now Stage 1's core deliverable** (was implicit in v2.5)
- **Boundary smell tests must be applied** before declaring archetype
- **SLA Cascade Reconciliation** is mandatory for composites/orchestrators
- **Decomposition Decision Log** captures rationale permanently
- **Audit & Regulatory Drivers** captured at the design layer (not just BRD)

## Inputs You Need

1. The Service Manifest with Stage 0 sections (1–7) complete
2. **`Shared/Decomposition_Smell_Tests_v1.0.md`** — the boundary heuristics
3. **`Shared/Minimum_Viable_Decomposition_Rules_v1.3.md`** — split / don't-split rules
4. **`Shared/Capability_Service_Skeleton_v1.0.md`** — required if archetype = Capability
5. **`Shared/Standard_Subflow_Library_v1.0.xlsx`** — for awareness during design (deeper alignment in Stage 2)

## Your Output

The same Service Manifest with **Sections 8–13 complete**:

| Section | Content | Required? |
|---|---|---|
| 8. Decomposition Decision | Archetype, smell tests, decision log entry | Required |
| 9. Service Boundary & Interfaces | Inputs, outputs, called services (if applicable) | Required |
| 10. Value Stream & Customer Journey | L0–L1 phases | Required |
| 11. Experience & Outcome Targets | SLA tiers, SLA cascade arithmetic | Required |
| 12. Audit & Regulatory Drivers | Control-to-regulation mapping | Required |
| 13. Service Lifecycle Stage | Designing/Implementing/Operating/etc. | Required |

## Authoring Rules

### Section 8 — Decomposition Decision (the most important section)

1. **Apply all 7 boundary smell tests in 8.2 before declaring archetype.** A failing smell test means the archetype is wrong.
2. **Capability if**: zero embedded service calls, single role does most of the work, can release/test/govern independently.
3. **Composite if**: 2–8 service calls, orchestrates a coherent business package, SLA derives from cascade of capability OLAs.
4. **Orchestrating if**: 5+ service calls across multiple variants (severity tiers, request types), routes work based on case discovery.
5. **Decision log entry is permanent.** Section 8.3 records the decision with date and reviewer. Future amendments are appended, not edited.

### Section 9 — Service Boundary

1. **Inputs and Outputs are explicit lists**, not paragraphs.
2. **Section 9.3 (Called Services) is mandatory for Composites/Orchestrators**, with cascade pattern (Sequential / Parallel / Pre-existing).
3. **Capabilities have zero entries in 9.3.** If you have entries, you're not actually a capability.

### Section 10 — Value Stream

1. **5–7 stages maximum.** More than 7 means you're describing tasks (Stage 2 territory).
2. **Stages are customer-visible phases**, not internal task lists.
3. **Each stage has a customer-side and service-side activity** to keep journey-centric framing.

### Section 11 — Experience & Outcome Targets

1. **Stated SLA must reconcile to underlying OLAs.** Section 11.2 shows the math.
2. **For composites/orchestrators, list every called service's OLA and execution mode.** The cascade table in the template enforces this.
3. **Variance > 0 requires written justification** or revised stated SLA. Don't ship a service with stated 10d but math says 11d unless justified.
4. **Tiered services (Critical/High/Medium/Low) reconcile per tier**, captured later in Section 19.

### Section 12 — Audit & Regulatory

1. **Every control step maps to a driver** (regulation, internal policy, contract).
2. **Evidence required** must be specific (e.g., "approver attestation logged with timestamp"), not vague ("approval recorded").
3. **Retention period** must be documented per evidence type.

### Section 13 — Lifecycle Stage

1. **Honest assessment.** Most services in design are at "Designing" — that's correct.
2. **Annual review date is mandatory** even at design stage. Schedule it now.

## Stage Gate (Exit)

Stage 1 is complete when:
- All sections 8–13 filled
- Section 8 archetype declared with all smell tests applied
- Section 11 SLA reconciliation shows zero variance OR documented justification
- Section 12 maps every regulatory-driven control to its driver
- Service Owner sign-off on archetype + SLA target
- Decomposition Decision Log entry present (Section 8.3)

## Common Mistakes to Avoid

| Mistake | Why it matters |
|---|---|
| Declaring "Composite" then listing zero called services in 9.3 | Mis-archetype — likely a capability |
| Declaring "Capability" then listing called services in 9.3 | Mis-archetype — likely a composite or mini-orchestrator |
| Stated SLA disagrees with computed SLA without justification | Service ships unenforceable; future breaches inevitable |
| Value stream with 12+ stages | You're doing Stage 2 work; back up |
| Audit drivers not mapped to specific evidence | Audit fails at first review |

## Handoff to Stage 2

Stage 2 picks up at Section 14 (Module Register). The decomposition decision in Section 8 is the most consequential input — Stage 2's task decomposition follows the archetype shape (Capability skeleton, Composite service-call pattern, Orchestrator multi-page structure).

## Self-Validation Before Delivering

| Check | Status |
|---|---|
| Section 8 declares archetype with rationale | Y/N |
| All 7 smell tests applied in 8.2 | Y/N |
| Section 9.3 entries match archetype (composite/orchestrator have entries; capabilities don't) | Y/N |
| Section 11.2 cascade arithmetic shows |variance| ≤ acceptable threshold or has justification | Y/N |
| Section 12 maps all regulatory controls to drivers | Y/N |
| Decomposition Decision Log entry created | Y/N |
| Manifest committed | Y/N |

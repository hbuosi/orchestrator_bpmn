# Capability Service Skeleton (v1.0)

## Purpose

Capability services follow a consistent structural pattern. This skeleton documents the pattern so designers don't reinvent it per service. Following the skeleton produces capabilities that compose cleanly into composites and orchestrators.

## Why a Skeleton

Empirical observation across the portfolio: every capability has the same 9 stages (intake → validate → execute → decide → communicate → archive → exit). Domain-specific variation is in the *Execute* stage; everything else repeats.

Codifying the skeleton:
- Reduces design time per capability (~40%)
- Improves reusability (capabilities look alike, plug in alike)
- Simplifies subflow library alignment
- Makes the workflow CSV trivial to render

## The 9-Stage Skeleton

| Stage | Required? | Default Shape | Default Lane | Notes |
|---|---|---|---|---|
| 1. Entry | Yes | Terminator: `Start (Service Call In)` | 1 (Caller Service) | Marks the call boundary |
| 2. Acknowledge | Yes | Process: `Receive {XXX} Request [M1]` | 2 (System) | Capability acks receipt |
| 3. Track | Yes | Delay: `SLA Timer Start [{OLA}]` | 2 (System) | OLA clock starts |
| 4. Validate / Triage | Yes | 1–3 shapes; optional resubmission loop | 3 (Front-line) | Domain-specific validation |
| 5. Execute | Yes | 3–5 domain shapes | 3 / 4 / 5 | The actual work — variable |
| 6. Decide | Yes | At least one Decision | 4 (Approver) | Outcome determination |
| 7. Communicate | Yes | Process: `Issue {XXX} Outcome [M5]` | 2 (System) | Notify caller |
| 8. Archive | Yes | Process: `Archive {XXX} Record` | 2 (System) | Records & retention |
| 9. Exit | Yes | Terminator: `End - {XXX} Complete` | 1 (Caller Service) | Returns control |

## Lane Convention for Capabilities

**Lane 1 = Caller Service** (NOT the original requester).

Capabilities don't have direct requesters — they're invoked by composites or orchestrators. Lane 1 represents the service-call boundary. The Start and End terminators sit there.

| Archetype | Lane 1 represents |
|---|---|
| Capability | Caller Service (composite/orchestrator that called this) |
| Composite | Original Requester |
| Orchestrating | Original Requester |

## Default Lane Skeleton (5 lanes)

| Lane | Role | Typical activities |
|---|---|---|
| 1 | Caller Service | Start / End terminators only |
| 2 | System | Acknowledge, Track, Communicate, Archive |
| 3 | Front-line Analyst | Validate, Triage, Execute (domain-specific) |
| 4 | Approver | Decide |
| 5 | Specialist (Risk / Legal / SME) | Specialist execution within Execute stage |

Capabilities with simpler scope may collapse to 4 lanes (drop the Specialist lane).

## Sizing Guardrails

| Metric | Target | Rationale |
|---|---|---|
| Total shapes | 8–18 | Above 18 suggests mini-orchestrator |
| Lanes | 3–5 | Above 5 suggests over-decomposition |
| Diagram width (columns) | ≤16 | Capabilities should be focused |
| Service calls embedded | 0 | Zero — by definition |
| Loops | 0–2 | Resubmission and rework only |

If a capability exceeds 18 shapes, suspect it's actually a composite. Re-run the decomposition smell tests in Section 8.

## Domain-Specific Variation in Stage 5 (Execute)

Stage 5 is where domain logic lives. Examples from the VND family:

| Capability | Execute stage shapes |
|---|---|
| VND-DD001 (Due Diligence) | Sanctions Screen → Adverse Media → Background → Beneficial Owner |
| VND-FIN001 (Financial Check) | Pull Financials → Request Credit Rating → Analyse Balance Sheet → Calculate Solvency Ratio |
| VND-SEC001 (Security Clearance) | Classify Risk → Standard or Deep Cyber Review → Data Handling Review |
| VND-CON001 (Contract Review) | Initial Legal Review → Negotiate → Update Contract → Final Approval → Owner Signature |
| VND-REG001 (ERP Registration) | Auto-Validate Payload → Create Vendor Record → Set Payment Terms → Set Tax Codes → Activate |

Notice: stages 1–4 and 6–9 are nearly identical across all five. Only stage 5 differs by domain.

## Subflow Library Alignment

The 9-stage skeleton aligns to standard subflow patterns:

| Skeleton Stage | Aligned Subflow |
|---|---|
| 1, 9 (Entry, Exit) | Service-Call-Boundary pattern |
| 2, 3 (Acknowledge, Track) | INT-Standard pattern |
| 4 (Validate / Triage) | TRI-Resubmission pattern (when loop present) |
| 5 (Execute) | Domain-specific — typically 1–2 EXE-* patterns |
| 6 (Decide) | APR1-Simple or APR2-Multi pattern |
| 7, 8 (Communicate, Archive) | CLS-Standard pattern |

A capability following the skeleton will typically reuse 4–5 standard subflows + 1–2 domain-specific patterns. Reuse rate target ≥75%.

## Authoring Checklist

When designing a new capability, verify:

| Check | Status |
|---|---|
| Lane 1 is "Caller Service" (not "Requester") | Y/N |
| Start terminator is "Start (Service Call In)" | Y/N |
| End terminator is "End - {XXX} Complete" | Y/N |
| All 9 stages present | Y/N |
| Total shapes 8–18 | Y/N |
| Stage 5 (Execute) has 3–5 domain shapes | Y/N |
| Section 21 (Subflow Alignment) shows ≥75% standard pattern reuse | Y/N |
| Zero embedded service calls | Y/N |

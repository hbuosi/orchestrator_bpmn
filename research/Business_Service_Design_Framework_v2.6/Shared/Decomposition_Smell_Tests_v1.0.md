# Decomposition Smell Tests (v1.0)

## Purpose

Concrete heuristics for catching decomposition errors before they cause downstream rework. Apply these tests at Stage 1 (Section 8.2) before declaring service archetype.

## When to Apply

- During Stage 1 — Section 8.2 of the Service Manifest
- During Stage 2.5 reviews of existing services (consolidation passes)
- When refactoring a service that "doesn't feel right"

A failing smell test means **reconsider the archetype** — it doesn't automatically mean the wrong choice was made, but it requires explicit justification.

## The 7 Smell Tests

### Test 1 — Single Trigger, Single Primary Outcome

| Pass | Fail |
|---|---|
| One way to start; one main success outcome | Multiple distinct triggers OR multiple unrelated outcomes |

**If failing:** Likely two services merged. Split.

### Test 2 — Single Accountability Boundary

| Pass | Fail |
|---|---|
| One service owner can sign off on the whole flow | Multiple owners with veto rights over different parts |

**If failing:** The service crosses an accountability boundary. Either consolidate ownership OR split the service.

### Test 3 — Composite/Orchestrator Has ≥2 Service Calls

| Pass | Fail |
|---|---|
| Declared as Composite/Orchestrator AND lists ≥2 explicit service calls in Section 9.3 | Declared as Composite/Orchestrator with 0 or 1 service calls |

**If failing:** It's actually a Capability. Re-declare.

### Test 4 — Capability Has Zero Embedded Service Calls

| Pass | Fail |
|---|---|
| Declared as Capability AND has zero service calls in Section 9.3 | Declared as Capability AND has any service calls |

**If failing:** It's actually a Composite or mini-Orchestrator. Re-declare.

### Test 5 — Independent Lifecycle

| Pass | Fail |
|---|---|
| Service can be released, tested, governed, deprecated independently | Service is so coupled to others that changes always cascade |

**If failing:** Decomposition is too fine-grained. Merge with the dominant coupled service.

### Test 6 — Alternate Flows Share ≥40% of Steps

| Pass | Fail |
|---|---|
| Alternate flows (variants) share ≥40% of steps with main flow | Alternate flow shares <40% of steps with main flow |

**If failing:** What looks like a variant is actually a separate service. Split.

This is a quantitative test. Count distinct task steps in main flow + variant; calculate overlap. Below 40% means the variants are different processes wearing the same name.

### Test 7 — No Single Role Owns >70% of Composite Work

| Pass | Fail |
|---|---|
| Composite — work distributed across ≥2 roles, none owning >70% | Composite — one role owns >70% of work |

**If failing:** What looks like a composite is actually a capability owned by that role. Re-classify.

This test only applies to Composites and Orchestrators. Capabilities can legitimately have one role owning most of the work.

## How to Apply

In Section 8.2 of the Manifest, for each test:

| Smell Test | Pass / Fail / N-A | Notes |
|---|---|---|
| Test 1 — Single trigger and single primary outcome | Pass | Single inbound channel; single success outcome |
| Test 2 — Single accountability boundary | Pass | Procurement Director owns end-to-end |
| Test 3 — Composite/Orchestrator: ≥2 service calls | Pass | Calls 5 capability services |
| Test 4 — Capability: zero embedded service calls | N-A | Not declared as capability |
| Test 5 — Independent lifecycle | Pass | Can release standalone |
| Test 6 — Alternate flows share ≥40% of steps | N-A | No variants in this service |
| Test 7 — No single role >70% of composite work | Pass | Distribution: 30%/25%/20%/15%/10% across 5 roles |

If any test fails, document the failure and either:
- Revise the archetype declaration, OR
- Justify why the failure is acceptable (e.g., "Test 6 fails at 35% but the variants are governed under different regulators, requiring separate services anyway")

## Common Patterns That Fail Tests

| Symptom | Failing Test | Likely Real Archetype |
|---|---|---|
| "Vendor Onboarding" with all work done by procurement team | 7 | Capability (vendor-onboard with no specialists) |
| "KYC Service" with one regulator for individuals, different one for businesses | 1, 6 | Two services: KYC-Individual + KYC-Business |
| "Customer Issue Resolution" with separate flows for billing / technical / general | 6 | Three services, possibly an orchestrator |
| "Approval Workflow" with sub-types having ≤30% step overlap | 6 | Multiple approval services |
| "Master Onboarding" with HR, IT, Security, Finance lanes | 7 | Likely an orchestrator (which is fine) — but explicitly model service calls |

## When Failures Are Acceptable

Sometimes a smell test fails for legitimate reasons. Document the rationale in Section 8.2 Notes:

- **Regulatory separation**: If the same logical work is governed by different regulators (e.g., AML for individuals vs corporates), separation is required even if step overlap is high.
- **SLA differentiation**: If two paths require materially different cycle times, they may be separate services even if step structure is similar.
- **Risk profile differentiation**: High-value vs low-value paths may need distinct services.

## Self-Validation

Apply this checklist before declaring archetype:

| Check | Status |
|---|---|
| All 7 tests applied | Y/N |
| Failures documented with justification | Y/N |
| Decision recorded in Section 8.3 (Decomposition Decision Log) | Y/N |
| Reviewed by service owner or peer | Y/N |

# Minimum Viable Decomposition Rules — v1.2

Use these rules during portfolio discovery and business design to avoid two common failure modes:
1) **mega-services** that cannot be automated or reused, and
2) **micro-services** that over-fragment delivery and governance.

## Core principle

A single internal service must have **one archetype** (Capability OR Composite OR Orchestrating).

Complex customer journeys (e.g., Entity Onboarding) are handled as a **Service Family**:
- a customer-facing navigation entry (optional UNIFIED overlay), plus
- one Orchestrating service, plus
- zero or more Composite services, plus
- multiple Capability services.

## Split into a separate internal service when any of the following is true

1. **Different trigger** (requester/channel/event) or different request type (Add/Modify/Delete).
2. **Different outcome state** (approval/decision types differ).
3. **Different SLA tier** or materially different cycle-time expectations.
4. **Different regulatory controls/evidence** requirements.
5. **Different system-of-record boundary** or different data ownership.
6. **Reuse potential**: will be used by 2+ other services/journeys or is already called elsewhere. *(See Reuse-First Principle below for operational definition.)*
7. **Independent automation lifecycle**: can be automated, tested, released, and governed independently.
8. **Distinct exception handling / compensation** is required.

## Do NOT split when

- It is simply a step inside the same decision/outcome, with the same SLA and the same controls.
- The only difference is "who does it" (role changes) but trigger/outcome/SLA/controls are the same.
- There is no reuse value and the separation would create coordination overhead.

## Practical guardrails (recommended)

- **Capabilities** should be stable "verbs" with clear inputs/outputs and evidence (e.g., *Validate*, *Screen*, *Create Record*).
- **Composites** should be reusable packages that call capabilities and add meaningful execution (e.g., *KYC Package*).
- **Orchestrators** should be few, variant-driven, and focused on routing/sequence/exception governance.

## Required outputs to prove decomposition is correct

- Service Family Index (one row per family)
- Membership table (all internal services, each with one archetype)
- Edge list (calls relationships) + SLA cascade pattern per edge (Pre-existing / Parallel / Sequential)

---

## Reuse-First Principle *(introduced v1.1, updated v1.2)*

### At the service level

Before designing a new service, check the existing portfolio catalogue. If a Capability service already exists that performs the same business function, consume it rather than building a new one.

### At the module level (subflow composability)

Before designing a new module within a service, check the **Standard Subflow Library**:

1. **If a standard subflow exists** for the module's function (e.g., INT-Standard for intake, CLS-Standard for closure, APR1-Simple for single-tier approval), the default is to **adopt it**. Deviation from the standard requires documented justification. Check the pattern's **maturity status** — Ratified and Stable patterns have the strongest reuse mandate; Provisional patterns may still change.

2. **If no standard subflow exists**, design the module per the Business Task Library, and at Stage 2.5 evaluate whether the resulting BT-code pattern is a candidate for the library.

3. **A module qualifies as a standard subflow candidate** when:
   - Its BT-code chain pattern appears (with the same structure) in **2 or more services**
   - The pattern is **not domain-specific** (i.e., it could plausibly appear in services outside the current domain)
   - It can be expressed as a **parameterised pattern** where the variable elements are configuration (e.g., approver role, SLA duration, rework cap) rather than structural differences

### Iterative discovery principle *(new in v1.2)*

The Standard Subflow Library is an empirically-derived catalogue. Its patterns are mined bottom-up from actual service decomposition work, not imported top-down from published workflow theory. Published pattern taxonomies (Van der Aalst Workflow Control-Flow Patterns, Erl SOA Design Patterns, Gartner Packaged Business Capabilities) serve three bounded purposes:

1. **Annotation** — each standard subflow is annotated with its underlying WCP control-flow primitives for structural traceability
2. **Anticipation** — the Gap Anticipation Checklist helps classify newly encountered patterns against known pattern types, but does not generate patterns preemptively
3. **Consolidation** — WCP annotations are the structural test for determining whether two apparently-distinct patterns should be merged or an over-aggregated pattern should be split

Published theory is a validation lens, not an input stream. Do not import patterns into the library that have not been empirically observed in the service portfolio.

### Measuring reuse

Track the following metrics at the portfolio level:
- **Unique Subflows to Develop**: count of distinct subflow implementations required
- **Reusable Standard Subflows**: count of patterns in the Standard Subflow Library consumed by 2+ services
- **Reuse Rate**: (module instances aligned to standard subflows) ÷ (total module instances across all services)
- **Target**: reuse rate ≥ 40% for a mature portfolio; ≥ 50% indicates strong composability
- **Pattern Emergence Rate** *(new in v1.2)*: new patterns discovered per batch of 20 services. A declining rate indicates library stabilisation.

---

## Module-Level Decomposition Guardrails *(introduced v1.1)*

When decomposing a service's workflow into modules (Stage 2), apply these additional rules:

### When to create a separate module

1. **Different BT-code family**: intake tasks (BT-INT) should be in a different module from approval tasks (BT-APR1).
2. **Different owner/swimlane**: if a block of tasks is owned by a different role, it is usually a separate module.
3. **Reuse boundary**: if a block of tasks matches a standard subflow pattern, package it as a module aligned to that pattern.
4. **SLA clock boundary**: if a block of tasks has a distinct SLA clock behaviour (pause, resume, checkpoint), it is usually a separate module.

### When NOT to create a separate module

- A single task that is merely a step within a larger module's flow.
- A notification that is always triggered as part of another module's completion (embed it in that module).
- An exception path that is structurally part of the approval/review module it belongs to (keep rework loops inside the approval module, not as a separate module).

---

## Pattern Maturity Lifecycle *(new in v1.2)*

Standard subflow patterns move through a maturity lifecycle that governs consumption and modification rights:

| Status | Service Count | Consolidation | Consumption Rule | Modification Rule |
|---|---|---|---|---|
| **Candidate** | 1 | Not yet consolidated | Not available for reuse outside originating service | May be restructured freely |
| **Provisional** | 2–4 | Not yet consolidated | Available for adoption; consumers accept change risk | Subject to structural change during consolidation |
| **Ratified** | 5+ | Passed ≥1 consolidation pass | Default adoption; deviation requires documented justification | Changes require governance approval |
| **Stable** | 10+ across 2+ waves | Passed ≥2 consolidation passes | Mandatory adoption; deviation requires formal exception | Changes require formal change request with impact analysis |

Maturity status is updated during consolidation passes and wave-level portfolio reviews.

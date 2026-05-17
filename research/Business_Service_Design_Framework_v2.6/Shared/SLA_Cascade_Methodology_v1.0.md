# SLA Cascade Methodology (v1.0)

## Purpose

A composite or orchestrating service's SLA must mathematically derive from its underlying capability OLAs plus transition times. This methodology defines the arithmetic. Used in Section 11.2 of the Service Manifest.

## The Cascade Equation

For any composite/orchestrator:

```
Stated SLA  =  Σ (sequential OLAs)  +  max(parallel OLAs)  +  Σ (transitions)
```

Plus an acceptable variance (typically ±10%) for:
- Optimisations not modelled (e.g., fast-path for low-risk vendors)
- Buffer for human handoff lag
- Holiday / weekend rounding

## Three Cascade Patterns

| Pattern | Definition | Contribution to SLA |
|---|---|---|
| **Sequential** | Step B starts only after Step A completes | Add A's OLA to total |
| **Parallel** | Steps A, B, C run concurrently | Add max(A, B, C) only |
| **Pre-existing** | Step relies on a previously-completed external state | Zero contribution (assumed already done) |

Most composites mix all three patterns.

## Worked Example — VND-ONB001

| Component | OLA | Mode | Contribution |
|---|---|---|---|
| Intake & Validate | 15m | Sequential (initial) | +15m |
| Initial Assessment | 4h | Sequential | +4h |
| Run Due Diligence (VND-DD001) | 5d | Parallel | 5d (max of parallel group) |
| Run Financial Check (VND-FIN001) | 3d | Parallel | (included above) |
| Run Security Clearance (VND-SEC001) | 4d | Parallel | (included above) |
| Risk Acceptable Decision | 2h | Sequential | +2h |
| Run Contract Review (VND-CON001) | 5d | Sequential | +5d |
| Register in ERP (VND-REG001) | 1d | Sequential | +1d |
| Closure & Notification | 1h | Sequential | +1h |
| **Computed total** | | | **≈11d 7h** |
| **Stated SLA** | | | **10d** |
| **Variance** | | | **+1d 7h (acceptable with justification)** |

The variance is justified because:
- DD/FIN/SEC parallelisation is conservative; in practice they run faster
- Risk-low vendors take a fast-path that skips Contract Review
- The 10d target reflects 80th percentile, not 100th

## When Variance Is Acceptable

| Justification | Acceptable? |
|---|---|
| Fast-path for a portion of cases | Yes — document the fast-path criteria |
| Parallelisation tighter than worst-case modelled | Yes — document the typical case |
| Buffer included in OLAs that compresses on average | Yes — note in capacity assumptions |
| "We always meet 10d in practice" without explanation | No — model what makes that true |
| "10d sounds better to customers" | No — revise the stated SLA to match math |

## When Variance Forces Action

Variance > 20% of stated SLA forces one of:

| Action | When to choose |
|---|---|
| Revise stated SLA upward | Math is solid; commitment is unrealistic |
| Optimise the cascade | Identify the longest contributors and reduce them |
| Add fast-path | If a meaningful subset of cases truly is faster, formalise it |
| Re-decompose | If parallelisation is being overstated, the architecture may be wrong |

## Tiered Services (Section 19)

Services with severity tiers (Critical / High / Medium / Low) reconcile per tier. Each tier has its own cascade.

| Tier | Computed SLA | Stated SLA | Variance |
|---|---|---|---|
| Critical | 24h | 24h | 0 |
| High | 52h | 48h | +4h (justified: fast-path) |
| Medium | 72h | 72h | 0 |
| Low | 7d | 5d | +2d (UNJUSTIFIED — review) |

If any tier shows unjustified variance, the service fails Stage 1 gate.

## Capability OLA Sourcing

Composite/orchestrator cascade arithmetic requires capability OLAs. Source from:

1. The capability's Service Manifest, Section 11 (Stated SLA)
2. NOT the capability's Section 18 (Capacity Assumptions) — that's about volume, not duration
3. NOT the capability's task-level OLAs — use the service-level commitment

If a capability's Section 11 SLA is not yet declared (capability not yet through Stage 1), the composite's SLA is provisional until the capability's SLA is settled.

## Transition Times

Transitions between capabilities consume time too. Common transitions:

| Transition | Typical contribution |
|---|---|
| Composite → Capability call (sync) | <1m (assumed instant) |
| Composite → Capability call (async, queue) | 5–15m queue wait |
| Decision → Next step | 0 (assumed instant) |
| Lane handoff (within capability or composite) | 15–60m queue wait |
| External integration call | 1–5m |

In practice, transitions add 5–15% to total cascade. Document explicitly when material (>5% of stated SLA).

## Authoring Workflow

1. List every step in the composite (Section 10 Value Stream + Section 9.3 Service Calls)
2. For each step, identify OLA and execution mode (Sequential / Parallel / Pre-existing)
3. Sum sequential OLAs + max of parallel groups + transitions
4. Compare to stated SLA
5. If variance > 0: justify or revise
6. Document the cascade table in Section 11.2

## Common Mistakes

| Mistake | Effect |
|---|---|
| Treating parallel as sequential | Inflates computed SLA; understates true performance |
| Treating sequential as parallel | Deflates computed SLA; overcommits to customers |
| Ignoring transitions | Computed SLA looks tighter than reality |
| Using task-level OLAs instead of service-level for capability calls | Double-counts capability internal duration |
| Stated SLA chosen before math is done | Anchoring bias; math gets fudged to match |

## Validation

When completing Section 11.2:

| Check | Status |
|---|---|
| Every step in the cascade has an OLA value | Y/N |
| Every step has an execution mode (Sequential / Parallel / Pre-existing) | Y/N |
| Capability OLAs sourced from capability Manifest Section 11 | Y/N |
| Transitions accounted for if material | Y/N |
| Computed SLA shown in the table | Y/N |
| Variance documented (zero or justified) | Y/N |
| For tiered services: Section 19 reconciles per tier | Y/N |

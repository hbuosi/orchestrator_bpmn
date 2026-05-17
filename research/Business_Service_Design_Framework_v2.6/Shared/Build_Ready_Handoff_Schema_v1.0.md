# Build-Ready Handoff Schema (v1.0)

## Purpose

Stage 3 (Build-Ready Requirements) produces the handoff to system design and build teams. This schema defines what the handoff must contain so build teams can estimate, design, and implement without re-asking design questions.

## Why a Schema

In v2.5 and earlier, BRDs often re-stated content already in Service Card / Blueprint / Task Model. The system design team would skip the BRD because it added no new information. v3.0 reframes the BRD as the **incremental** document — it adds only what wasn't in earlier stages and is essential to build.

## Required Content (Section 23 of Manifest)

### 23.1 Data Contracts

For every input and output crossing the service boundary:

| Field | Description |
|---|---|
| Contract Name | The named payload or document |
| Direction | Inbound / Outbound |
| Schema Reference | URI to formal schema, OR JSON-shape description |
| Mandatory Fields | Listed |
| Optional Fields | Listed |
| Versioning Strategy | How changes will be versioned |
| Notes | Any special handling |

If a formal schema doesn't exist, describe in JSON-shape:

```
{
  "vendorId": "string (mandatory)",
  "legalName": "string (mandatory)",
  "registrationNumber": "string (mandatory)",
  "businessType": "enum: corp/partnership/sole (mandatory)",
  "addresses": "array of {street, city, country, type} (mandatory ≥1)",
  "contactEmail": "string email (mandatory)",
  "establishedDate": "date (optional)"
}
```

### 23.2 Integration Points

For every external system the service touches:

| Field | Description |
|---|---|
| External System | Named system |
| Direction | Outbound / Inbound / Bidirectional |
| Protocol | REST / SOAP / Message queue / SFTP / etc. |
| Frequency | Per-request / Batch / Streaming |
| Authentication | OAuth2 / API key / Cert / etc. |
| Rate Limits | If known |
| Fallback Behaviour | What to do if integration unavailable |
| SLA Dependency | Service's SLA dependency on this integration |

### 23.3 Automation Candidates Confirmed

From the Task Register's automation candidates, narrow to confirmed for first build:

| Field | Description |
|---|---|
| Task ID | From Task Register |
| Automation Mode | Manual → Assisted → Automated |
| Build Approach | Job worker / Decision rule / API integration / Human-in-loop |
| Prerequisites | Schema, auth, data, etc. that must be in place |
| Estimated Effort | High-level (days, not hours) |
| Phase | Phase 1 (initial) / Phase 2 (later) |

## What Goes In Section 24 — KPI Inheritance

KPIs of this service map to:
- **Parent KPIs** (composite KPIs this service contributes to)
- **Child KPIs** (capability KPIs whose performance affects this service)

| Field | Description |
|---|---|
| KPI Name | Metric name |
| Definition | Numerator / denominator / computation |
| Source Tasks | Which Task IDs generate the data |
| Parent KPI | Composite KPI this rolls up to (if any) |
| Child KPI | Capability KPI that rolls up into this (if any) |
| Frequency | Daily / Weekly / Monthly |
| Baseline / Target | Expected and aspirational values |

## What Goes In Section 25 — Operating Model

### 25.1 RACI

For major activities (intake, decisions, exceptions, closure):

| Activity | Responsible | Accountable | Consulted | Informed |
|---|---|---|---|---|
| Specific activity | Named role | Named role | Named role(s) | Named role(s) |

Use roles, not individual names. RACI is structural.

### 25.2 Governance Cadence

| Forum | Frequency | Attendees | Purpose |
|---|---|---|---|
| Operations Review | Weekly | Service Owner + Operations | Volume, breaches |
| Design Review | Quarterly | Service Owner + Designers | Design changes |
| Lifecycle Review | Annual | Service Owner + Sponsor | Continued investment |

## What Goes In Section 26 — Acceptance Criteria

Each criterion is:

| Field | Description |
|---|---|
| Criterion | What must be true at go-live |
| Test Approach | Load test / Boundary test / Audit / etc. |
| Pass Threshold | Specific number |
| Test Owner | Who runs the test |

Criteria must be:
- **Testable** — has a pass/fail threshold
- **Observable** — can be measured at go-live or steady-state
- **Specific** — not "service performs well" but "p95 cycle time ≤ 8d at 200 requests/day"

## What Goes In Section 27 — Risks & Open Questions

| Field | Description |
|---|---|
| Item | Risk or open question |
| Type | Risk / Issue / Decision needed / Open question |
| Owner | Named individual |
| Resolution Date | Target |
| Notes | Context |

Outstanding `[SME INPUT REQUIRED]` from earlier stages migrate here if not resolved.

## What Stage 3 Does NOT Repeat

Build teams already have access to the manifest. Stage 3 should **not** restate:

| Topic | Where it lives |
|---|---|
| Service purpose, boundary, owner | Section 1 |
| Customer journey | Section 2 |
| Demand profile | Section 4 |
| Decomposition decision | Section 8 |
| Value stream | Section 10 |
| Module structure | Section 14 |
| Task detail | Section 15 |
| Workflow diagram | Section 20 |

Stage 3's job is to **add what's missing** for build readiness — not to summarise what's already documented.

## Self-Validation

Before declaring Stage 3 complete:

| Check | Status |
|---|---|
| Section 23.1 covers every input/output across the boundary | Y/N |
| Section 23.2 covers every external integration | Y/N |
| Section 23.3 lists every confirmed automation candidate with build approach | Y/N |
| Section 24 maps every KPI with parent/child where applicable | Y/N |
| Section 25.1 RACI uses roles, not individual names | Y/N |
| Section 26 criteria are testable (have thresholds) | Y/N |
| Section 27 has no unresolved [SME INPUT REQUIRED] | Y/N |
| Build team representative has reviewed Section 23 and confirms it's sufficient for estimation | Y/N |

## Common Mistakes

| Mistake | Effect |
|---|---|
| Restating Service Card content | Build team skips the document |
| Acceptance criteria without thresholds | Go/no-go decision becomes subjective |
| Integration without auth detail | Build blocks at integration sprint |
| KPIs without parent/child mapping | Portfolio dashboards can't aggregate |
| Open questions left unowned | Risks become incidents post-go-live |

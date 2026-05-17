# Gap Anticipation Checklist — v1.0

This checklist identifies pattern families that are **expected to emerge** from future service waves but have not yet been observed (or have been observed in insufficient quantity) in the current Standard Subflow Library. It is derived from Van der Aalst's control-flow, exception handling, and resource pattern perspectives and from Erl's SOA composition pattern catalogue.

## Purpose

When a new module is encountered during Stage 2.5 that does not match any existing standard subflow, consult this checklist to determine whether the pattern represents a known structural type. This accelerates classification — it does not authorise pre-emptive import of patterns into the library.

**Rule:** No pattern from this checklist may be added to the Standard Subflow Library until it has been empirically observed in 2+ services through bottom-up decomposition.

## Anticipated pattern families

### Control-flow patterns not yet represented

| Anticipated Family | Expected WCP Structure | Likely BT Context | When Expected to Emerge |
|---|---|---|---|
| Parallel Approval | WCP-2, WCP-3, WCP-4 | Two or more approvers review simultaneously; all must approve | High-value services with committee governance (50+ services) |
| Conditional Approval Chain | WCP-6, WCP-7, WCP-4 | Number and identity of approval tiers determined at runtime by request attributes | Services with risk-tiered approval matrices (30+ services) |
| First-Response External | WCP-2, WCP-9 | Request sent to multiple external parties; proceed on first response | External consultation/referral services (40+ services) |
| Scheduled Batch Execution | WCP-21, WCP-18 | Work accumulated and executed on a schedule (weekly, monthly) | Periodic reporting and compliance services (60+ services) |
| Event-Driven Trigger | WCP-16 | Workflow activated by system event rather than human request | Monitoring and alerting services (50+ services) |

### Exception handling patterns not yet represented

| Anticipated Family | Expected Structure | Likely BT Context | When Expected to Emerge |
|---|---|---|---|
| Compensation/Rollback | Exception + reversal sequence | Undo completed work when downstream failure occurs | Multi-service orchestrations with commit dependencies (80+ services) |
| Retry with Backoff | WCP-10 + WCP-18 | Automated retry on external system failure with increasing delay | Integration-heavy services with external dependencies (40+ services) |
| Partial Completion | WCP-6, WCP-11 | Service delivers partial outcome when some branches fail | Complex composite services with optional components (60+ services) |

### Resource patterns not yet represented

| Anticipated Family | Expected Structure | Likely BT Context | When Expected to Emerge |
|---|---|---|---|
| Workload Balancing | Resource allocation + WCP-2 | Route to least-loaded team member | High-volume operational services (80+ services) |
| Delegation Chain | Resource reallocation + WCP-1 | Original assignee delegates to specialist, retains accountability | Services with tiered expertise requirements (50+ services) |
| Four-Eyes Principle | Resource separation + WCP-1 | Different person must review than person who executed | Compliance-critical services (30+ services) |

### SOA composition patterns not yet represented (from Erl)

| Anticipated Family | Erl Pattern | Likely BT Context | When Expected to Emerge |
|---|---|---|---|
| Service Callback | Capability Recomposition | Calling service receives async response from called service | Complex orchestrations with long-running capabilities (60+ services) |
| Intermediate Event | Event-Driven Messaging | Workflow paused pending external system event | Integration-heavy services (40+ services) |

## How to use during Stage 2.5

1. Encounter a module that does not match any existing standard subflow.
2. Check this checklist — does the module's structure match an anticipated family?
3. If yes: classify the module using the anticipated family name and WCP structure in the alignment map notes. Flag it as a **potential new pattern candidate** for the next consolidation pass.
4. If no: classify as N/A — Single-use unless cross-service evidence suggests otherwise.
5. **Never** add an anticipated pattern to the Standard Subflow Library based on this checklist alone. Empirical observation in 2+ services is required.

## Maintenance

This checklist is reviewed and updated during each consolidation pass. Patterns that have been empirically confirmed and added to the Standard Subflow Library are removed from the checklist and noted in the Governance Log.

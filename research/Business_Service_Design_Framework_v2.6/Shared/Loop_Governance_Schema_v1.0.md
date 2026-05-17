# Loop Governance Schema (v1.0)

## Purpose

Every loop in a workflow needs governed entry: re-entry point, max cycles, timeout, escalation, clock policy. This schema defines what's required for each loop and why. Used in Section 16 of the Service Manifest.

## Why Loops Are Governance-Sensitive

Loops are where most operational issues originate:
- Unbounded loops cause stuck cases
- Loops without timeouts hold SLA clocks indefinitely
- Loops without reason codes can't be reported
- Loops without escalation paths trap work permanently

A documented loop governance entry forces explicit answers to "what stops this loop, when, and what happens next?"

## Loop Types

| Type | Definition | Example |
|---|---|---|
| Resubmission | Validation gate sends work back to requester for correction | Missing fields → request more info → resubmit |
| Rework | Quality / approval gate sends work back to executor for redo | Approval rejected → redo the deliverable |
| Negotiation | Two parties iterate to consensus | Contract terms negotiated with vendor |
| Iteration (Discovery) | Investigation cycles between hypotheses | Incident analysis: hypothesis → test → revise |

Most services have at most 2 loops; complex investigations may have 3.

## Required Fields per Loop

| Field | Description | Example |
|---|---|---|
| Loop ID | Unique identifier within service (L-01, L-02…) | L-01 |
| Loop Type | Resubmission / Rework / Negotiation / Iteration | Resubmission |
| Re-entry Task ID | Which task work returns to | BT-005 (Validation) |
| Max Cycles | Hard cap; loop terminates at this count | 2 |
| Timeout | Wall-clock cap; loop terminates after this duration | 48h from initial loop entry |
| Escalation Path | What happens when cap or timeout is hit | Escalate to Service Owner; auto-reject after 5 days |
| Clock Policy | Stop / Continue / Mixed (which states pause SLA clock) | Stop during "Awaiting Customer" state |
| Reason Codes | Predefined list of stop/cycle reasons | "Missing field", "Schema invalid", "Out of scope" |

## Clock Policy Detail

| Policy | Effect | Use case |
|---|---|---|
| Stop | SLA clock pauses while waiting; resumes when work returns | Waiting on customer / external party |
| Continue | SLA clock keeps running through wait | Internal rework — service team owns the delay |
| Mixed | Clock stops in some states, continues in others; states explicitly named | Complex services with both customer and internal waits |

For Mixed policies, list the specific states (case statuses) and their clock behavior.

## Reason Codes

Each loop has a predefined list of reason codes that explain *why* the loop fired. Reason codes serve three purposes:

1. **Reporting** — count loops by reason; identify the top friction sources
2. **Pattern detection** — repeated reasons across services may indicate a portfolio-level fix
3. **Audit trail** — each loop instance records which reason applied

Format: 3–8 reason codes per loop. Granular enough to be useful, not so granular that they're rarely used.

Example for a Resubmission loop:
- "Missing required field"
- "Schema invalid"
- "Identity unverified"
- "Out of service scope"
- "Other (with notes)"

## Escalation Path Detail

The escalation path activates when max cycles or timeout is hit. Specify:

| Question | Answer required |
|---|---|
| Who gets notified? | Named role or persona |
| What's the escalation outcome? | Reject, escalate to higher approver, refer to exception handling, etc. |
| What's the SLA impact? | Does the case still count against original SLA? |
| Is there a manual override path? | Some loops allow extending cap with senior approval |

## Section 16 Table Format

In the Service Manifest, Section 16 uses this 8-column table (one row per loop):

| Loop ID | Loop Type | Re-entry Task ID | Max Cycles | Timeout | Escalation Path | Clock Policy | Reason Codes |
|---|---|---|---|---|---|---|---|
| L-01 | Resubmission | BT-005 | 2 | 48h | Auto-reject; notify requester | Stop during "Awaiting Customer" | Missing field; Schema invalid; Out of scope |
| L-02 | Rework | BT-012 | 2 | 5d | Reject + close; escalate to Service Owner | Continue | Approval rejected; Quality issue; Compliance failure |

## Workflow CSV Cross-Reference

Every loop in Section 16 must correspond to a loop-back arrow in the Workflow CSV (Section 20). The mapping:

| Section 16 field | CSV element |
|---|---|
| Loop ID | Comment / annotation on the loop-back line (optional) |
| Re-entry Task ID | Target of the loop-back line (Line Destination) |
| Max Cycles in label | Embedded in line label, e.g., "Resubmit (max 2)" |
| Timeout, Escalation, Clock Policy, Reason Codes | Section 16 only — not in CSV |

The CSV shows the loop exists; Section 16 governs the loop. Both must agree.

## Validation

Before declaring Stage 2 complete:

| Check | Status |
|---|---|
| Every loop-back line in Workflow CSV has a Section 16 row | Y/N |
| Every Section 16 row has all 8 fields populated | Y/N |
| Reason Codes ≥3 per loop | Y/N |
| Escalation Path names a specific role/action | Y/N |
| Clock Policy is one of Stop/Continue/Mixed (not blank) | Y/N |
| Max Cycles is a specific number (not "as needed") | Y/N |
| Timeout is a specific duration (not "TBD") | Y/N |

## Common Mistakes

| Mistake | Effect |
|---|---|
| "Max Cycles: as needed" | Effectively unbounded loop — production stuck cases |
| Reason codes too generic ("Other" only) | No reporting value; can't identify friction |
| No escalation path | Loops trap work when capped |
| Clock policy left blank | SLA reporting becomes inconsistent |
| Loop in CSV but no Section 16 row | Ungoverned loop slips through |

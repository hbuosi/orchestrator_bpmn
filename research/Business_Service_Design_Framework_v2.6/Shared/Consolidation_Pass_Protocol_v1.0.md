# Consolidation Pass Protocol — v1.0

## Purpose

The consolidation pass is a mandatory portfolio-level review that ensures the Standard Subflow Library remains structurally sound as it grows through iterative service decomposition. It is performed after every batch of approximately 20 services completes Stage 2.5, or at the end of each wave — whichever comes first.

## Trigger

Run a consolidation pass when any of the following conditions are met:
- ~20 new services have completed Stage 2.5 since the last consolidation
- A wave of services has completed (regardless of count)
- The library has grown by 5+ new patterns since the last consolidation
- A new pattern family has been proposed that did not previously exist

## Inputs

- Current Standard Subflow Library (with WCP annotations)
- All Subflow Alignment Maps from services processed since the last consolidation
- Control-Flow Pattern Reference
- Gap Anticipation Checklist

## Protocol steps

### Step 1 — WCP structural deduplication

Compare all patterns that share the same WCP annotation but have different Standard IDs.

For each pair:
- Do they differ only in parameterisation (approver role, SLA duration, form fields)? → **Merge candidate**: consolidate into one pattern with parameterised configuration.
- Do they differ in structural BT-code sequence? → Confirm they are genuinely distinct despite shared WCP codes. Document the structural difference.

### Step 2 — Split evaluation

Review patterns with high service coverage (5+) that have accumulated frequent Modify change types in their alignment maps.

For each:
- Do the Modify changes cluster into 2–3 distinct structural variants? → **Split candidate**: propose the variants as distinct patterns with their own Standard IDs.
- Are the Modify changes random/service-specific? → Retain as one pattern; the Modify changes reflect parameterisation, not structural divergence.

### Step 3 — Family coherence review

For each pattern family (INT, APR1, APR2, CLS, etc.):
- Are the variants within the family ordered by complexity (Basic → Standard → Extended)?
- Do the WCP annotations within the family show a clear progression (each variant adds control-flow complexity)?
- Are there any variants that belong in a different family based on their WCP structure?

### Step 4 — Maturity status update

Update the maturity status of every pattern based on current service coverage:

| Current Status | Condition | New Status |
|---|---|---|
| Candidate | 2+ services now consume it | → Provisional |
| Provisional | 5+ services AND passed this consolidation | → Ratified |
| Ratified | 10+ services across 2+ waves AND passed 2+ consolidations | → Stable |
| Any status | 0 services consume it after this consolidation | → Deprecated (flag for removal) |

### Step 5 — Gap anticipation review

Check the Gap Anticipation Checklist against patterns observed in this batch:
- Any anticipated patterns now empirically confirmed in 2+ services? → Propose for addition to the library.
- Any new pattern types observed that are not on the checklist? → Add to the checklist for future anticipation.

### Step 6 — Metrics capture

Record the following metrics for the consolidation pass:

- Total patterns in library (before / after)
- Patterns merged (count + details)
- Patterns split (count + details)
- New patterns added (count + details)
- Patterns deprecated (count + details)
- Maturity status changes (count by transition type)
- Pattern emergence rate (new patterns in this batch ÷ services in this batch)
- Portfolio reuse rate (current)

## Outputs

1. **Updated Standard Subflow Library** — with merged/split/new/deprecated patterns and updated maturity statuses
2. **Consolidation Pass Report** — structured summary of all changes, metrics, and rationale
3. **Updated Gap Anticipation Checklist** — with newly confirmed or newly anticipated patterns
4. **Governance Log entry** — recording the consolidation pass date, scope, and key decisions

## Governance

The consolidation pass is owned by the Service Design Lead and reviewed by the Platform Architect. Both must sign off on:
- All pattern merges and splits
- All new pattern additions
- All maturity status changes
- All deprecation decisions

Disagreements on structural decisions (merge vs keep separate, split vs retain) are resolved by WCP annotation: if the WCP structure is the same, the default is merge; if the WCP structure differs, the default is keep separate.

# Business Task Flow Export — Guide (v1.6)

## What this is

The **Business Task Flow Export** is a Lucidchart-compatible CSV that can be imported directly to produce a **swimlane diagram** (cross-functional flowchart).

It represents the **business task layer (L1.5)**:
- tasks and decisions as shapes
- roles as swim lanes (including a dedicated **System** lane)
- sequencing and decision branches as connecting lines
- compact OLA timing in shape labels (detailed timing in Task Register)
- task type traceability via Task Type Codes

## What changed in v1.6

v1.6 introduces the **Diagram Quality Rules** that ensure first-time-right rendering on Lucidchart import. Previous versions produced CSVs that imported but required Business Analyst cleanup; v1.6 closes that gap. Refer to `Shared/Diagram_Quality_Checklist_v1.0.md` for the standalone reference.

Specifically, v1.6:
- caps lane names at 18 characters
- caps shape labels at 30 characters, single-line
- standardises time units to `m` / `h` / `d`
- prescribes lane order by handoff frequency (not org chart)
- requires consistent shape types across services
- adopts 100-series Id numbering with insertion gaps
- caps shapes at 25 per page (multi-page variants)
- caps loop-back distance at 4 columns
- prohibits self-loops
- moves repeated module patterns to compression (one shape per module where possible)
- moves detailed OLA arithmetic out of shape labels (Task Register only)

## Mandatory deliverable rules

The Business Task Flow Export CSV is **mandatory** for every service that proceeds to business sign-off.

### One CSV per service (multiple pages for variants)

- **Capability services:** 1 workflow CSV per service (L1.5 task-level), single page
- **Composite services:** 1 workflow CSV per service (L1.5 task-level), single page, including explicit "service call" steps where the service depends on other services
- **Orchestrating services:** 1 workflow CSV with **one page per variant** at L0–L1 phase level, plus confirmation that each called service has its own task-level workflow CSV

### File naming (recommended)

```
{ServiceID}_{ServiceName}_BUS.csv
```

For services with multiple variants, the variants live as separate pages within a single CSV file (Rule 10), not separate CSVs. Variant-specific filenames are no longer recommended.

### Stage gate

No Business Requirements (Stage 2) and no Business Package (Stage 3) should be produced until:
- the Task Register exists, and
- the Business Task Flow Export CSV exists, and
- both are traceable to each other (1 row per task ↔ 1 shape in the CSV), and
- the CSV passes the Pre-Import Validation Checklist in `Shared/Diagram_Quality_Checklist_v1.0.md`.

## Files

- Template: `Business_Task_Flow_Export_Template_v1.4.csv` (updated for v1.6 rules)
- Quality checklist: `Diagram_Quality_Checklist_v1.0.md`

## Relationship to the Task Register

The CSV is **the diagram**. It contains only what Lucidchart needs to draw shapes, lanes, and lines, plus lightweight metadata for traceability.

Business-level detail (inputs, outputs, evidence, full SLA breakdown, automation mode, business rules, exceptions, severity-tiered OLAs) lives in the **Business Task Register** (Excel), not in this CSV. The two artefacts are complementary:

| Artefact | Purpose | Detail level |
|----------|---------|-------------|
| Task Register (XLSX) | Business documentation — rules, evidence, full SLA decomposition, automation candidacy | Full |
| Task Flow Export (CSV) | Diagramming — visual layout for stakeholder alignment + task type traceability | Compact shape labels with OLA suffix, connections, Task Type Codes |

Keep both in sync: every shape in the CSV should trace to a row in the Task Register, and vice versa.

**Important shift from v1.5:** detailed timing (e.g., "Critical 4h / High 8h / Med 24h / Low 48h") that previously appeared in shape labels now lives **only** in the Task Register. The CSV's shape label carries only the compact OLA for that variant's page.

## Module tagging (for modular workflow visibility)

To gain business-level visibility of **how many reusable modules** are needed to cover your automation needs, every Business Workflow CSV must carry module metadata.

**Rule:** Every Process / Decision / Delay shape that represents part of the workflow must include a **Module ID** in `Text Area 3`.

- `Text Area 3` = Module ID (e.g., `M-INT-01`)
- `Text Area 4` = Module name (optional but recommended)

## CSV structure

The CSV uses the Lucidchart import format. There are three types of rows: **Page**, **Shapes**, and **Lines**.

### Column definitions

| Column | Purpose |
|--------|---------|
| `Id` | Unique numeric identifier. **Use 100-series for shapes, 1000-series for lines, with gaps for inserts (Rule 6).** |
| `Name` | Row type: `Page`, `Swim Lane`, `Process`, `Decision`, `Delay`, `Terminator`, or `Line` |
| `Shape Library` | `Flowchart Shapes` for shapes; blank for Page and Line rows |
| `Page ID` | The `Id` of the Page this element belongs to. Use `1`, `2`, `3`… for multi-page variant CSVs. |
| `Contained By` | For shapes: which swim lane column the shape sits in, formatted as `{lane_Id}:{column_number}` (e.g., `2:1` = lane 1, `2:2` = lane 2) |
| `Line Source` | For lines: the `Id` of the shape where the line starts |
| `Line Destination` | For lines: the `Id` of the shape where the line ends |
| `Source Arrow` | Arrow style at line source (use `None`) |
| `Destination Arrow` | Arrow style at line destination (use `Arrow`) |
| `Text Area 1` | **For shapes:** the shape label (≤30 chars, single line, with compact OLA suffix). **For Swim Lane:** the name of lane 1 (≤18 chars). **For Lines:** branch label (`Yes`, `No`, or short loop label) |
| `Text Area 2` | **For shapes:** the Task Type Code from the Business Task Library (e.g., `BT-INT`, `BT-APR1`). **For Swim Lane:** the name of lane 2. Empty for Start/End terminators and Lines. |
| `Text Area 3` | **Swim Lane row:** name of lane 3. **Shape rows:** Module ID. Blank for Lines. |
| `Text Area 4` | **Swim Lane row:** name of lane 4. **Shape rows:** Module name (optional). Blank for Lines. |
| `Text Area 5` | **Swim Lane row:** name of lane 5. **Shape rows:** Module category (optional). Blank for Lines. |
| `Text Area 6` | **Swim Lane row:** name of lane 6. **Shape rows:** Module variant key (optional). Blank for Lines. |

### Row types

**Page** (one row per page; multi-page CSVs have multiple Page rows):
```
1,Page,,,,,,,,Page 1,,,,,
```

**Swim Lane** (one row — defines all lane names; appears once per page):
```
2,Swim Lane,Flowchart Shapes,1,,,,,,Lane 1,Lane 2,Lane 3,Lane 4,Lane 5,Lane 6
```

**Shapes** (one row per diagram node):
```
{Id},Process,Flowchart Shapes,1,2:N,,,,,Label [Xm],BT-XXX,M-XXX-NN,Module Name,,
```

**Lines** (one row per connection):
```
{Id},Line,,1,,{src},{dst},None,Arrow,{branch},,,,,
```

## Lane order and naming (Rule 1, Rule 2)

Lane names must be ≤ 18 characters. Lanes are ordered by handoff frequency, not org chart hierarchy.

**Default 6-lane pattern for service workflows:**

| Position | Role | Example name | Length |
|---|---|---|---|
| Lane 1 | Flow originator | Reporter / Requester | 8 / 9 |
| Lane 2 | System (automation) | System | 6 |
| Lane 3 | Front-line analyst | Cyber Analyst / Service Desk | 13 / 12 |
| Lane 4 | Decision authority | Cyber Lead / IC / Approver | 15 / 8 |
| Lane 5 | Specialist execution | IT Support | 10 |
| Lane 6 | Governance / risk | Risk & Compliance | 17 |

**Why System is Lane 2, not Lane 3 (change from v1.5):** the most frequent handoff in service workflows is Reporter → System (intake), then System → Analyst (triage). Placing System adjacent to Reporter minimises arrow length on the highest-volume handoff path.

Deviations from this pattern require documented justification based on actual handoff frequency data.

## Shape labelling rules (Rule 3, Rule 4, Rule 12)

Every shape label is single-line, ≤ 30 characters, with optional compact OLA suffix.

| Format | Example |
|---|---|
| `{Verb} {Object} [{OLA}]` | `Determine Root Cause [2h]` |
| `{Action} & {Action} [{OLA}]` | `Eradicate & Recover [Var]` |
| `{Verb} {Object} [{Milestone}]` | `Send Closure + CSAT [M5]` |
| `{Decision Question}?` | `Is it Critical?` |
| `Start` / `End - {Outcome}` | `Start` / `End - Resolved` |

**OLA suffix format:**
- Compact units: `m` (minutes), `h` (hours), `d` (days)
- Drop "Business" from days
- Use `[Var]` or `[Variable]` for variable durations
- Single value per variant page (severity-specific values live in Task Register)

| Bad | Good |
|---|---|
| Create Ticket & Send Acknowledgement [M1 — 15 Min] | Intake & Acknowledge [M1, 15m] |
| Conduct Post-Incident Review [10 Business Days] | Conduct PIR [10d] |
| SLA Timer Start [Severity-Tiered Critical 24h] | SLA Timer Start [Crit 24h] |
| Containment [Critical 4h / High 8h / Med 24h] | Execute Containment [4h] |

## Task Type Code conventions (Text Area 2)

Every shape (except Start/End terminators) includes a Task Type Code from the Business Task Library:

| Code | Meaning | Typical shape |
|---|---|---|
| `BT-INT` | Capture / receive | Process |
| `BT-TRI` | Triage & route | Process |
| `BT-VAL` | Validate completeness | Decision or Process |
| `BT-ELG` | Eligibility check | Decision or Process |
| `BT-RSK` | Risk/compliance assessment | Process |
| `BT-APR1` | Single-step approval | Decision |
| `BT-APR2` | Multi-step approval | Decision |
| `BT-STK` | Stakeholder engagement | Process |
| `BT-EXE` | Execute fulfilment work | Process |
| `BT-REV` | Review & quality check | Process or Decision |
| `BT-DLC` | Collect deliverables | Process |
| `BT-COM` | Stakeholder communication | Process (System lane for notifications) |
| `BT-TRK` | Status tracking | Process or Delay (System lane) |
| `BT-EXC` | Exception handling | Process |
| `BT-ESC` | Escalation | Process |
| `BT-CLS` | Closure & confirmation | Process |
| `BT-KPI` | KPI capture/reporting | Process |

If a task does not map to any library type, use a custom code (e.g., `BT-CUS-001`) and note it in the Task Register.

## Modelling rules

1. **One row per diagram node.** Do not combine multiple tasks into one shape unless applying compression per Rule 11.
2. **Use Decision shapes only when paths diverge.** If both paths lead to the same next step, it is not a decision.
3. **Use business nouns** (roles, policies, approvals) — not system nouns (assignment groups, queues, scripts).
4. **Keep labels ≤ 30 characters, single line, verb-first.** Apply Rule 3 strictly.
5. **Compress repeated patterns** (Rule 11). Three sequential intake shapes become one. Detail moves to Task Register.
6. **Maximum 25 shapes per page** (Rule 7). Variants split across pages (Rule 10).
7. **Every flow has exactly one Start** (Terminator) and **at least one End** (Terminator).
8. **Loop-backs are short** (Rule 8). ≤ 4 columns of distance. Place decision shapes near loop targets.
9. **No self-loops** (Rule 9). Use loop markers, annotations, or move to Task Register.
10. **Id numbering** uses 100-series shapes, 1000-series lines, with insertion gaps (Rule 6).
11. **System lane shapes** are placed in the System lane (typically Lane 2 in v1.6+). SLA timers, milestone notifications, and automated activities go here.
12. **Every non-terminator shape includes a Task Type Code** in Text Area 2.
13. **Every Process / Decision / Delay shape includes a Module ID** in Text Area 3.

## System lane conventions

The System lane (typically Lane 2 in v1.6+, was Lane 3 in v1.5 and earlier) hosts shapes that represent automated or system-triggered activities.

| Shape type | Purpose | Example label |
|---|---|---|
| Delay (SLA Timer) | Marks when the SLA clock starts | `SLA Timer Start [Nh]` |
| Process (Notification) | Automated milestone notification | `Send M1 Acknowledge` |
| Process (Closure) | Automated closure activity | `Send Closure + CSAT [M5]` |
| Process (Archive) | Automated archive | `Archive Case` |

**Important change in v1.6:** Tracking overlay (SLA Checkpoints + Track Progress with self-loop) is removed from the diagram. Tracking lives in the Task Register's Tracking module row. The CSV represents the visible business workflow only.

## Iteration and back-and-forth loops (resubmission / rework)

Many services require multiple cycles before reaching a final outcome. This is supported and expected.

### How to model loops in the CSV

Use three elements:

1. **Decision** — the pass/fail gate (e.g., `Request Complete?`, `Approved?`, `Resolution Verified?`)
2. **Process** — the "not yet" action (e.g., `Request Missing Info [4h]`, `Revise Deliverables [3d]`)
3. **Loop-back Line** — connection back to the correct re-entry step
   - Label the returning line with explicit outcome (e.g., `Resubmit`, `Rework`, `No (re-triage)`)
   - Loop distance ≤ 4 columns (Rule 8)
   - No self-loops (Rule 9)

### Governance rules (capture in the Task Register / BRD)

Whenever a loop exists, define in the Task Register:

- **Re-entry point** (by Task ID)
- **Stop condition** (max cycles, timeout/expiry, escalation, terminate)
- **Clock policy** (whether SLA pauses)
- **Operational states** (e.g., `Returned for correction`, `Awaiting requester`)
- **Reason codes & evidence** required at each loop trigger

These details do not appear in the diagram. The diagram shows the loop existence and the labelled return line; the Task Register holds the governance.

## Variant handling for orchestrators (Rule 10)

Orchestrating services with severity-tiered or other variants use multi-page CSVs:

| Page | Content |
|---|---|
| Page 1 | Highest-severity / primary variant full flow |
| Page 2 | Second variant full flow |
| Page 3 | Third variant full flow |
| Page N | Last variant |
| Final page | Legend (OLA reference, milestone codes, lane definitions) |

Variant-specific OLAs appear on each page's shape labels. Cross-variant comparison lives in the Task Register and the legend page, not in shape labels.

This consolidates four (or more) previously-separate variant CSVs into a single artefact.

## How to import into Lucidchart

1. Save the CSV file.
2. In Lucidchart: **File → Import Data → CSV**.
3. Select the CSV file.
4. Lucidchart renders the swimlane diagram.
5. **Run `Arrange → Auto-layout → Horizontal`** to apply Lucid's auto-spacing.
6. Verify against the Pre-Import Validation Checklist in `Shared/Diagram_Quality_Checklist_v1.0.md`.

## Tips

- **Lane order matters more than any other setting.** Order by handoff frequency. The single change of moving System adjacent to Reporter reduces arrow length by ~30%.
- **Compress aggressively.** Three intake shapes become one. Two recovery shapes become one. Detail moves to Task Register.
- **Standardise time units** (`m`, `h`, `d`). Across 25 labels, consistent units save 50–100 characters of total label width.
- **Don't fight Lucid's auto-layout.** Run it after import; don't hand-position shapes. The CSV's job is to give Lucid clean inputs; Lucid's job is to position.

## Version history

| Version | Changes |
|---------|---------|
| v1.2 | Initial release. 3 Text Areas. No System lane. No OLA labelling. No Task Type Codes. No Delay shapes. |
| v1.3 | Added System lane (Lane 3). Expanded to 6 Text Areas. Added Text Area 2 for Task Type Codes. Added OLA duration in square brackets. Added Delay shape for SLA timers. |
| v1.4 | Made workflow CSV mandatory per service (and per variant). Added explicit coverage for Capability / Composite / Orchestrating services and variant naming rules. |
| v1.5 | Module tagging via Text Area 3 (Module ID). Tracking overlay pattern with self-loop. |
| **v1.6** | **First-time-right Diagram Quality Rules introduced. Lane name cap (18 chars). Shape label cap (30 chars, single line). Standard time units (m/h/d). Lane order by handoff frequency (System now Lane 2). 100-series Id numbering. Max 25 shapes/page. Loop-back distance cap (4 columns). Self-loops prohibited. Module compression encouraged. Variant pages within one CSV (replaces variant-per-CSV). Tracking overlay moved to Task Register only. Companion artefact: `Diagram_Quality_Checklist_v1.0.md`.** |

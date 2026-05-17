# Diagram Quality Checklist — v1.0

## Purpose

This checklist defines the authoring rules and pre/post-import verifications that produce **first-time-right** Lucidchart Business Workflow CSVs.

It applies to every CSV produced under Stage 2 (Business Task Model & Workflow). Following this checklist eliminates the rework cycle where a Business Analyst opens the imported diagram, finds layout problems, and manually redraws.

Use this alongside the Business Task Flow Export Guide (v1.6+). The Guide defines what the CSV must contain; this Checklist defines how authoring choices affect rendering quality.

## The 12 Authoring Rules

### Rule 1 — Lane names ≤ 18 characters

Long lane names trigger Lucidchart's auto-sizing logic, which produces multi-line lane headers that overlap shapes near the lane edge.

| Bad | Good |
|---|---|
| Cybersecurity Analyst (21) | Cyber Analyst (13) |
| Cybersecurity Lead / IC (23) | Cyber Lead / IC (15) |
| Risk and Compliance Office (26) | Risk & Compliance (17) |

### Rule 2 — Lane order by handoff frequency, not org chart

Lane 1 is the lane the flow enters. Lane 2 is the lane that receives the most handoffs from lane 1. And so on. The goal is to minimise total vertical distance of arrows.

Default lane order pattern for service workflows:

| Position | Role | Rationale |
|---|---|---|
| Lane 1 | Requester / Reporter | Flow origin |
| Lane 2 | System | Receives most handoffs from Lane 1 and from human work |
| Lane 3 | Service Desk / Front-line analyst | Most active middle lane |
| Lane 4 | Senior / Approver / Lead | Decision authority |
| Lane 5 | Specialist execution role (e.g., IT Support) | Execution-heavy role |
| Lane 6 | Governance / Compliance / Risk | Used for gates only |

Deviation from this pattern is allowed only when handoff data shows a different flow.

### Rule 3 — Single-line shape labels ≤ 30 characters

Long labels force Lucid to wrap text and resize shapes. Different shape sizes break alignment with surrounding shapes.

| Bad | Good |
|---|---|
| Create Ticket & Send Acknowledgement [M1 — 15 Min] (50) | Intake & Acknowledge [M1, 15m] (30) |
| Conduct Post-Incident Review [10 Business Days] (47) | Conduct PIR [10d] (17) |
| Analyse & Determine Root Cause [2 Hours] (39) | Determine Root Cause [2h] (25) |

### Rule 4 — Standardised time units: m / h / d

Always use the abbreviated forms `m` (minutes), `h` (hours), `d` (days). Drop "Business" qualifier from days.

| Bad | Good |
|---|---|
| 15 Minutes | 15m |
| 2 Hours | 2h |
| 10 Business Days | 10d |
| 24 Clock Hours | 24h |

### Rule 5 — Consistent shape types for similar concepts

Use the same shape type for the same kind of step every time.

| Concept | Shape | Lane |
|---|---|---|
| Human task | Process | Role lane |
| System task | Process | System lane |
| Decision (yes/no, A/B) | Decision | Decision-owner lane |
| SLA timer / wait | Delay | System lane |
| Start / End | Terminator | Originating / outcome lane |
| Notification (M1, M2, etc.) | Process | System lane |

Never mix Process and Decision for the same conceptual step across services.

### Rule 6 — Id numbering with insertion gaps

Use 100-series shape Ids (100, 110, 120…) and 1000-series line Ids (1000, 1010, 1020…). This leaves room to insert a step at 105 or a line at 1015 without renumbering.

| Bad | Good |
|---|---|
| 3, 4, 5, 6, 7, 8, 9, 10 | 100, 110, 120, 130, 140, 150, 160, 170 |
| 100, 101, 102 | 100, 110, 120 |

### Rule 7 — Maximum 25 shapes per page

Beyond 25 shapes, Lucid's auto-layout produces poor results regardless of authoring quality. Compress (Rule 11) or split across pages (Rule 10).

### Rule 8 — Loop-backs ≤ 4 columns

Long-distance loops (e.g., a re-triage line going from column 7 back to column 2) cross multiple unrelated shapes and produce visual clutter. Two fixes:

- Place the decision shape closer to the loop target
- Insert a labelled connector / off-page reference instead of drawing the long loop

### Rule 9 — No self-loops

A line from a shape to itself (`source = destination`) renders awkwardly in Lucid. Replace with:

| Replace self-loop with | When |
|---|---|
| Loop marker (annotation: "Repeats every checkpoint") | Recurring activity |
| Move to Task Register only (not in CSV) | Background tracking that doesn't belong in the diagram |

### Rule 10 — Multi-page structure for variants

Orchestrating services with multiple variants (e.g., severity-tiered) use one CSV file with multiple pages:

| Page | Content |
|---|---|
| Page 1 | Variant 1 (e.g., Critical) full flow |
| Page 2 | Variant 2 (e.g., High) full flow |
| Page 3 | Variant 3 (e.g., Medium / Low) full flow |
| Page N | Last variant (e.g., False-Positive) |
| Final page | Legend + variant comparison table |

One file, multiple pages, single source. Do not produce separate CSV files per variant.

### Rule 11 — Compress repeated patterns

Identify modules that consistently appear as 2–3 sequential shapes and collapse them to single shapes:

| Common compression | From | To |
|---|---|---|
| Intake module | Create Ticket → SLA Timer → Auto-Enrich (3 shapes) | Intake & Acknowledge [M1] (1 shape) |
| Closure module | Document → Send Closure → Archive (3 shapes) | Document & Close (1 shape) |
| Recovery module | Eradicate → Recover (2 shapes) | Eradicate & Recover (1 shape) |
| Tracking overlay | Checkpoints + Track Progress (2 shapes + self-loop) | Move to Task Register only |

Detail not lost — it lives in the Task Register row for that module. The CSV is a diagram artifact, not a Task Register substitute.

### Rule 12 — OLA values in labels only as compact bracketed suffix

OLA values should appear in shape labels as a brief bracketed suffix `[Nm/h/d]`. Detailed OLA arithmetic, SLA reconciliation, and breach thresholds belong in the Task Register, not in the diagram.

| Bad (OLA dominates label) | Good (OLA as suffix) |
|---|---|
| Containment [Critical 4h / High 8h / Med 24h] (44) | Execute Containment [4h] (24) |

Severity-tiered OLAs are captured per-variant on each variant's page (Rule 10), not all on one shape.

## Pre-Import Validation Checklist

Before importing a CSV to Lucidchart, verify each item:

| Check | Pass criterion |
|---|---|
| All lane names | ≤ 18 characters |
| All shape labels | ≤ 30 characters, single line |
| Time units | All using `m`, `h`, or `d` (no "Minutes", "Hours", "Days") |
| Total shapes per page | ≤ 25 |
| Decision branches | Both branches labelled in `Text Area 1` of line rows |
| Loop-back distance | ≤ 4 columns of horizontal travel |
| Self-loops | None |
| Lane order | Matches handoff frequency (Rule 2) |
| Page structure | One page per variant + legend page |
| Id numbering | Shapes 100–999, lines 1000+ |
| Shape types | Consistent across services per Rule 5 |
| OLA values | Compact `[Nm/h/d]` form in suffix only |

## Post-Import Steps in Lucidchart

After Lucid imports the CSV, perform these actions in order:

| Step | Action |
|---|---|
| 1 | Run `Arrange → Auto-layout → Horizontal` |
| 2 | Verify lane order top-to-bottom matches CSV |
| 3 | Visually scan for any arrow crossing unrelated shapes |
| 4 | Run `View → Validate` to catch orphan shapes or unconnected lines |
| 5 | Add the legend page if not in the CSV |
| 6 | Lock the layout (`Edit → Lock`) before sharing |

If steps 1–4 produce a clean diagram, the CSV passes. If not, return to authoring and apply the relevant rule above.

## Outcome Metrics

A first-time-right CSV produces a diagram that:

| Metric | Target |
|---|---|
| Fits one screen at 100% zoom | Yes |
| Lane labels readable without truncation | Yes |
| All arrows visible and uncrossed (≥95%) | Yes |
| Stakeholders can review without BA cleanup | Yes |
| Diagram width | ≤ 20 columns |

## Authoring Discipline at the Prompt Layer

These rules are reflected in the Business Task Model Prompt (Stage 2 v2.2+). Every Stage 2 generation that follows the prompt will produce import-ready CSVs by construction. If the prompt is changed locally (forking, customisation), preserve the rules in this checklist or first-time-right behaviour will degrade.

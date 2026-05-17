# DGE Service Orchestrator — System Guide

## Overview

The DGE Service Orchestrator transforms a government service description — plain text or spreadsheet — into complete technical documentation using AI (Claude by Anthropic).

The system follows the **Business Service Design Framework v2.6** by the Abu Dhabi Department of Government Enablement (DGE), the official methodology for designing, documenting, and preparing government services for automation.

---

## Generation Modes

### Mode 1 — Service Card + BPMN

Generates a combined single-page viewer containing:

- **Service Card** — structured service metadata following UAE TDRA standards: service code, name (English and Arabic), eligibility criteria, required documents, fees, SLA, legal basis, transformation stage, UAE Pass level, output documents.
- **BPMN 2.0 Diagram** — interactive process flow with semantic colour coding:
  - Green — happy path / start / success end
  - Purple — human/user tasks
  - Teal — automated/service tasks
  - Blue — decision gateways
  - Orange — exception handling
  - Red — cancellation / rejection ends

**Use when:** rapid prototyping, stakeholder demos, or when the full framework is not required.

---

### Mode 2 — Full Manifest — Single Pass

Generates the complete Service Manifest (§1–27) in a single AI call. Produces 5 separate PDF-ready documents simultaneously.

**Use when:** producing a first complete draft quickly, running demos, or when the service is already well-described.

---

### Mode 3 — Full Manifest — Stage by Stage

Generates one stage at a time with a review gate between each stage. Each stage uses the previous stages as context. After Stage 3, the complete §1–27 unified manifest is generated automatically.

**Use when:** running a formal design process with approval gates, presenting to a client at each stage gate, or when quality control per stage is required.

---

## The Service Manifest v2.6

The Service Manifest is the **single source of truth** for a government service. It consolidates what was previously 4–7 separate documents into one structured artefact with **27 numbered sections** across 4 stages.

```
Stage 0 ──► Stage 1 ──► Stage 2 ──► Stage 3
  §1–7        §8–13      §14–22      §23–27
  Define      Design      Model       Build
```

Each stage has a review gate before proceeding to the next.

---

## Stage 0 — Service Definition (§1–7)

**Colour:** Green `#2E7D32` · **Gate question:** *Is the service clearly defined? Is scope, demand, and stakeholder ownership confirmed?*

| Section | Content |
|---------|---------|
| §1 Service Identification | Service code (e.g. `DGE-BL-001`), name in English and Arabic, category, owning entity, trigger, expected outcome, in-scope and out-of-scope boundary |
| §2 Customer Journey Context | Journey phase, preceding and following service, touchpoints, pain points |
| §3 Capability Reuse Search | Search for existing government capabilities to avoid duplication. Decision per entry: `consume`, `fork`, or `new` |
| §4 Demand & Capacity Profile | Estimated annual volume, peak periods, delivery channels (online / app / call-center / in-person), current capacity baseline |
| §6 Data Inventory | CRUD matrix per data element: what the service creates, reads, updates, and deletes; sensitivity classification; retention period |
| §7 Stakeholder & Persona Map | Role, type (approver / reviewer / operator / escalation / informed), responsibilities, organisation |

---

## Stage 1 — Service Design (§8–13)

**Colour:** Blue `#1565C0` · **Gate question:** *Is the architecture correct? Are SLAs achievable? Are service boundaries clear?*

| Section | Content |
|---------|---------|
| §8 Decomposition Decision | Service archetype: **Capability** (atomic, end-to-end), **Composite** (bundles multiple capabilities sequentially), or **Orchestrating** (calls other services, never executes work directly). Includes boundary smell tests and decision log |
| §9 Service Boundary & Interfaces | Inputs, outputs, and called services with cascade pattern (Sequential / Parallel / Pre-existing) and OLA |
| §10 Value Stream & Customer Journey | 3–7 value stream phases from both the customer and service perspective |
| §11 Experience & Outcome Targets | Stated SLA vs. computed SLA (OLA cascade arithmetic), variance, and justification if applicable |
| §12 Audit & Regulatory Drivers | Control steps requiring audit evidence, applicable regulation or policy, and retention period |
| §13 Service Lifecycle Stage | Current phase: Designing / Implementing / Operating / Retiring; annual review date |

---

## Stage 2 — Task Model & Workflow (§14–22)

**Colour:** Orange `#E65100` · **Gate question:** *Is the task model complete? Does the BPMN diagram accurately represent the process?*

| Section | Content |
|---------|---------|
| §14 Module Register | Logical groupings of tasks (e.g. `MOD-01`, `MOD-02`), each with an OLA and subflow maturity level (Candidate / Provisional / Ratified / Stable / Deprecated) |
| §15 Task Register | Detailed task list (e.g. `T01`, `T02`): type code, digitization mode (automated / assisted / manual), OLA, capacity assumptions, exception path, automation candidate flag |
| §16 Loop Governance | Rules for iterative processes (Resubmission / Rework / Negotiation): max cycles, timeout, clock policy, escalation path |
| §20 Workflow Diagram | Interactive BPMN 2.0 viewer embedded in the document. Export buttons: PDF, SVG, BPMN XML |
| §21 Subflow Alignment Summary | Mapping of each module to a Workflow Control Pattern (WCP) code (e.g. `WCP-01` Sequence, `WCP-04` Exclusive Choice) with deviation notes |

---

## Stage 3 — Build-Ready Requirements (§23–27)

**Colour:** Purple `#6A1B9A` · **Gate question:** *Does the development team have everything needed to build? Are risks mapped? Are acceptance criteria clear?*

| Section | Content |
|---------|---------|
| §23 Build-Ready Handoff | **Data Contracts** (mandatory/optional fields, versioning strategy) · **Integration Points** (external systems, protocol, frequency, authentication, fallback behaviour) · **Automation Candidates** (task ID, build approach, prerequisites, Phase 1 or Phase 2) |
| §24 KPI Inheritance | KPI name, definition, source tasks, parent/child KPI relationship, measurement frequency, baseline, and target |
| §25 Operating Model | **RACI Matrix** (Responsible / Accountable / Consulted / Informed per activity) · **Governance Cadence** (forum, frequency, attendees, purpose) |
| §26 Acceptance Criteria | Criterion, test approach, pass threshold, test owner |
| §27 Risks & Open Questions | Item, type (Risk / Issue / Decision needed / Open question), owner, resolution date, notes |

---

## Single Pass vs. Stage by Stage

### Full Manifest — Single Pass

```
Input (text or spreadsheet)
        │
        ▼
  [ 1 API call — Claude Opus ]
  Generates complete ServiceManifest JSON
  (all 4 stages + BPMN in one response)
        │
        ▼
  System validates JSON schema + BPMN structure
  Renders 5 HTML documents in parallel
        │
        ▼
  5 links delivered simultaneously:
    ● Stage 0 — Service Definition     (green)
    ● Stage 1 — Service Design         (blue)
    ● Stage 2 — Task Model & Workflow  (orange)
    ● Stage 3 — Build-Ready            (purple)
    ● Complete Manifest §1–27          (black)
```

| | |
|-|-|
| **API calls** | 1 |
| **Internal consistency** | Guaranteed — all stages share the same generation context |
| **Speed** | Fastest total time |
| **Control** | Low — all-or-nothing; retry restarts from scratch |
| **Token budget** | High — full manifest JSON in one response |

---

### Full Manifest — Stage by Stage

```
Input (text or spreadsheet)
        │
        ▼
  [ Call 1 — Stage 0 ]
  Generates §1–7 only
        │
  ┌─────▼──────┐
  │  Gate 0    │  ← User reviews Stage 0 PDF and decides to proceed
  └─────┬──────┘
        │
  [ Call 2 — Stage 1 ]
  Generates §8–13 · Stage 0 JSON sent as context
        │
  ┌─────▼──────┐
  │  Gate 1    │  ← User reviews Stage 1 PDF and decides to proceed
  └─────┬──────┘
        │
  [ Call 3 — Stage 2 ]
  Generates §14–22 + BPMN · Stages 0+1 JSON sent as context
        │
  ┌─────▼──────┐
  │  Gate 2    │  ← User reviews Stage 2 PDF and decides to proceed
  └─────┬──────┘
        │
  [ Call 4 — Stage 3 ]
  Generates §23–27 · Stages 0+1+2 JSON sent as context
  Complete Manifest rendered automatically
        │
        ▼
  4 stage PDFs + 1 Complete Manifest
```

| | |
|-|-|
| **API calls** | 4 (sequential) |
| **Internal consistency** | High — each stage receives prior stages as context |
| **Speed** | Slower total time |
| **Control** | Full — review and approve each stage before proceeding |
| **Token budget** | Distributed — smaller per call, context grows progressively |
| **Failure scope** | Isolated — only the failing stage is retried |

---

## Mode Selection Guide

| Scenario | Recommended mode |
|----------|-----------------|
| Stakeholder demo or quick prototype | Service Card + BPMN |
| First complete draft of a new service | Full Manifest — Single Pass |
| Formal design process with stage approvals | Full Manifest — Stage by Stage |
| Stage gate meeting with client or manager | Full Manifest — Stage by Stage |
| Input is a complex intake spreadsheet | Full Manifest — Single Pass or Stage by Stage |
| Need to validate BPMN before committing to §23–27 | Full Manifest — Stage by Stage |
| Need documentation quickly for a presentation | Full Manifest — Single Pass |

---

## Document Output Structure

Each stage renders an independent HTML file with:

- Standardised header with service code, generation date, stage badge, and covered sections
- Numbered sections and tables matching the v2.6 framework exactly
- **Export PDF** button using `window.print()` — no external dependencies
- **Interactive BPMN viewer** (Stage 2 only) with SVG, XML, and PDF download buttons

The **Complete Manifest** additionally includes:
- Fixed left-side navigation bar linking to all 27 sections
- Colour-coded stage dividers
- Smooth scroll navigation

---

## AI Model Strategy

All generation modes use the same retry strategy:

| Attempt | Model | Max tokens |
|---------|-------|-----------|
| 1–2 | `claude-opus-4-7` (primary) | 6,000–16,000 depending on mode |
| 3–4 | `claude-sonnet-4-6` (fallback) | 8,000–32,000 depending on mode |

- The server streams the response with a heartbeat every 4 seconds to keep the UI responsive during generation.
- JSON output is validated against Zod schemas after each attempt. BPMN structure is validated separately for structural errors (disconnected flows, empty branches, gateway violations).
- If all 4 attempts fail, the system returns an error with the last validation message.

---

## Data Flow

```
POST /api/generate
{ mode, text, stage?, previousStages? }
        │
        ▼
Claude API — SSE streaming
        │
        ▼
Zod schema validation (4 attempts: Opus ×2, Sonnet ×2)
        │
        ▼
BPMN XML generated + semantic colours applied
        │
        ▼
HTML templates rendered (one per stage)
        │
        ▼
SSE event sent to browser:
  manifest_complete → { outputs: { stage0, stage1, stage2, stage3, complete } }
  stage_complete    → { stage: N, html, manifest }
        │
        ▼
Blob URLs created in browser → user opens in new tab → exports PDF
```

---

## Glossary

| Term | Definition |
|------|-----------|
| **Service Manifest** | The master document containing all 27 sections of the framework |
| **Stage Gate** | Formal review and approval checkpoint between stages |
| **BPMN 2.0** | Business Process Model and Notation — international standard for process diagrams |
| **OLA** | Operational Level Agreement — internal SLA between teams |
| **SLA** | Service Level Agreement — commitment to the citizen or customer |
| **RACI** | Responsible, Accountable, Consulted, Informed — responsibility assignment matrix |
| **KPI** | Key Performance Indicator |
| **WCP** | Workflow Control Pattern — standardised flow pattern (e.g. Sequence, Exclusive Choice, Parallel Split) |
| **Capability** | Atomic service that does one thing end-to-end |
| **Composite** | Service that bundles multiple capabilities sequentially |
| **Orchestrating** | Service that coordinates other services without executing work directly |
| **SSE** | Server-Sent Events — server-to-browser streaming protocol |
| **Opus 4.7** | Primary Claude model — most capable, used for all first attempts |
| **Sonnet 4.6** | Fallback Claude model — used if Opus fails after 2 attempts |
| **Blob URL** | In-browser URL pointing to a generated HTML file, opened in a new tab |

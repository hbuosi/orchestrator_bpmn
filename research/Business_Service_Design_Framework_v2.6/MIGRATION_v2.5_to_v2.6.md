# Migration Guide — v2.5 to v2.6

## Summary

v2.6 is a substantial restructure but **methodology-compatible**. Existing v2.5 services don't break; their content migrates into the manifest format. Migration takes ~2 hours per service.

## What Stays the Same

| Asset | Status |
|---|---|
| WCP annotations | Preserved (now Manifest §21 column) |
| Standard Subflow Library | Preserved |
| Diagram Quality Rules (12) | Preserved (now v1.1, minor edits) |
| Workflow CSV format | Preserved (Lucidchart import unchanged) |
| Theoretical grounding (SOA, DDD, BPM) | Preserved |
| Stage gates | Preserved (just 4 of them now) |

## What Changes

| v2.5 | v2.6 |
|---|---|
| Service Card .docx | Manifest §1 |
| Intake Form .xlsx | Manifest §1, §3, §4, §6, §7 |
| Business Blueprint .docx | Manifest §8–13 |
| Business Task Model .docx | Manifest §14–22 |
| Business Workflow CSV | Same format, but rendered from Manifest §14–15 |
| Subflow Alignment Map .csv | Manifest §21 |
| Business Requirements Document .docx | Manifest §23–27 |
| 5 stages | 4 stages |
| Stage 2.5 | Merged into Stage 2 |

## Migration Workflow Per Service

### Step 1 — Set Up

1. Copy `Templates/Service_Manifest_Template_v1.0.docx` to `[ServiceID]_Manifest.docx`
2. Open the manifest

### Step 2 — Migrate Stage 0 Content (~15 min)

| From v2.5 | To Manifest Section |
|---|---|
| Service Card §1 (Service Identity) | §1 (Service Identification) |
| Intake Form draft Module Register | (saved for Stage 2 migration) |
| Service Card §2 (Customer / Citizen Profile) | §2 (Customer Journey Context) |
| (NEW — was implicit) | §3 (Capability Reuse Search — fill from current portfolio context) |
| Service Card §6 (Demand Profile) | §4 (Demand & Capacity Profile) |
| Service Card §7 (As-Is) | §5 (As-Is Process Analysis) |
| Service Card §10 (Data) | §6 (Data Inventory) |
| Service Card §3 (Stakeholders) | §7 (Stakeholder & Persona Map) |

### Step 3 — Migrate Stage 1 Content (~30 min)

| From v2.5 | To Manifest Section |
|---|---|
| Blueprint §3 (Service Archetype) | §8 (Decomposition Decision) — apply smell tests retroactively |
| (NEW — was implicit) | §8.3 (Decomposition Decision Log entry) |
| Blueprint §4 (Service Boundary) | §9 (Service Boundary & Interfaces) |
| Blueprint §5 (Value Stream) | §10 (Value Stream & Customer Journey) |
| Blueprint §6 (Outcomes) | §11.1 (Service-Level SLA Targets) |
| (NEW — was implicit) | §11.2 (SLA Cascade Reconciliation — compute from existing OLAs) |
| Service Card §11 (Compliance) | §12 (Audit & Regulatory Drivers) |
| (NEW — was implicit) | §13 (Service Lifecycle Stage) |

### Step 4 — Migrate Stage 2 Content (~45 min)

| From v2.5 | To Manifest Section |
|---|---|
| Task Model §B (Module Register) | §14 (Module Register) — add Aligned Subflow + Maturity columns |
| Task Model §C (Task Register) | §15 (Task Register) — add Capacity Assumption column |
| Task Model §D (Iteration Controls) | §16 (Loop Governance) — restructure to schema |
| (NEW — was scattered) | §17 (Exception Pathways) — add per task |
| (NEW — was implicit) | §18 (Capacity Assumptions) — extract from Task Register / Service Card |
| Variant CSVs (if orchestrator) | §19 (Severity-Tier Reconciliation) — per variant |
| Workflow CSV | §20 (Workflow Diagram) — reference, no change to CSV |
| Subflow Alignment Map (Stage 2.5) | §21 (Subflow Alignment Summary) |
| (NEW — was implicit) | §22 (Pattern Drift Notes) — note any Provisional consumptions |

### Step 5 — Migrate Stage 3 Content (~30 min)

| From v2.5 | To Manifest Section |
|---|---|
| BRD §3 (Functional Requirements) | (mostly already in §15 Task Register — discard) |
| BRD §4 (Non-Functional Requirements) | (mostly already in §11 — discard duplicates) |
| BRD §5 (Data Requirements) | §23.1 (Data Contracts) |
| BRD §6 (Integration Requirements) | §23.2 (Integration Points) |
| BRD §7 (Automation Requirements) | §23.3 (Automation Candidates Confirmed) |
| BRD §8 (KPIs) | §24 (KPI Inheritance) — add parent/child mapping |
| BRD §9 (Operating Model) | §25 (Operating Model) |
| BRD §10 (Acceptance Criteria) | §26 — restructure to testable criteria |
| BRD §11 (Risks) | §27 (Risks & Open Questions) |

### Step 6 — Validation

Run the validation checklists in each stage prompt to confirm the migrated manifest is internally consistent.

## What If a Service Has Variants? (Orchestrators)

For orchestrators with multi-variant CSVs (e.g., CYB-IR001 with Critical/High/Med/Low/FP variants):

1. Single manifest documents the orchestrator
2. Section 19 (Severity-Tier Reconciliation) covers SLA per variant
3. Workflow CSV is multi-page (one page per variant + legend)
4. Each variant's tasks are documented in Section 15 (Task Register) with variant tag

If variants share <40% of steps (Decomposition Smell Test 6 fails), consider splitting into separate services.

## What If a Service Is in a Family?

For service families (composite + capabilities):

1. One manifest per service in the family
2. Composite/orchestrator's manifest has Sections 28 (Family Index) + 29 (Dependency Manifest)
3. Each capability's manifest is standalone (Family Index references it)
4. Bundle the family manifests + CSVs into a zip per family

## Migration Prioritisation

| Priority | Migrate first |
|---|---|
| 1 | Orchestrators with multi-variant CSVs (high benefit from manifest consolidation) |
| 2 | Service families (composite + capabilities — benefit from Family Index) |
| 3 | Services with active design changes (combine migration with the change) |
| 4 | Stable services with no impending changes (defer until next refresh) |

Don't migrate services that are stable and not actively changing — they'll migrate at next refresh, which is when the cost is lowest.

## What You Don't Need to Do

- **Don't rewrite Workflow CSVs** if they pass Diagram Quality Rules (v1.1 is backward-compatible)
- **Don't migrate stable services** unless they're being touched anyway
- **Don't recreate WCP annotations** — they carry forward into Section 21
- **Don't change subflow library** — patterns and maturities carry forward

## Common Migration Gotchas

| Gotcha | Resolution |
|---|---|
| v2.5 services skipped reuse search | Document retroactively in §3; mark as "Retrospective: searches not done at original Stage 0" |
| v2.5 services have OLAs without capacity assumptions | Add to §18 with current best estimate; flag as needing capacity testing |
| v2.5 services have ungoverned loops | §16 audit will surface them; document or remediate |
| v2.5 services have Composite archetype but only 1 service call | §8 smell tests will fail; reconsider archetype during migration |
| v2.5 BRD has 12 sections, only 5 fit v2.6 BRD | Discard duplicates; only migrate what's incremental to manifest |

## Validation After Migration

For each migrated service, verify:

| Check | Status |
|---|---|
| All 27 manifest sections addressed (some may be N/A) | Y/N |
| Decomposition Decision Log entry added (Section 8.3) | Y/N |
| SLA Cascade arithmetic completed (Section 11.2) | Y/N |
| Exception paths documented for every task (Section 17) | Y/N |
| Capacity assumptions documented for every OLA (Section 18) | Y/N |
| Subflow alignment retained from Stage 2.5 (Section 21) | Y/N |
| Workflow CSV referenced (Section 20) | Y/N |
| BRD content split: kept (handoff-relevant) vs discarded (duplicates) | Y/N |

## Estimated Effort

| Service Type | Migration Time |
|---|---|
| Capability service (simple, ≤15 shapes) | 60–90 min |
| Composite service (1 page, ≤25 shapes) | 90–120 min |
| Orchestrating service (multi-variant) | 2–3 hours |
| Service family (1 composite + N capabilities) | 1 day |

For a portfolio of 100 services with ~20 actively changing, plan ~40 hours of migration spread across 4–6 weeks.

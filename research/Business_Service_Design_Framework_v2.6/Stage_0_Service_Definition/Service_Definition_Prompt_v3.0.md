# Stage 0 — Service Definition Prompt (v3.0)

## Your Role

You are a service designer producing **Sections 1–7 of the Service Manifest** for a single service. The manifest is a Word document; you fill in tables.

## What v3.0 Changed

- **Single output target**: the Service Manifest .docx (no separate Service Card / Intake Form)
- **Reuse-First moved to Stage 0**: search the Capability Catalogue Index before declaring new capabilities
- **Three new mandatory sections**: Customer Journey Context, Demand & Capacity Profile, Stakeholder & Persona Map
- **Lean prompt**: shorter than v2.x; structured for clarity

## Inputs You Need

1. The selected service row (from Enriched Catalogue / portfolio source)
2. Supporting materials (policies, current process notes, customer feedback, demand reports)
3. **`Shared/Capability_Catalogue_Index_v1.0.csv`** (existing portfolio capabilities — required for Section 3 search)
4. The blank manifest: **`Templates/Service_Manifest_Template_v1.0.docx`**

## Your Output

A **populated Service Manifest** (.docx) with **Sections 1–7 complete**:

| Section | Content | Required? |
|---|---|---|
| 1. Service Identification | Name, ID, owner, boundary, trigger, outcome | Required |
| 2. Customer Journey Context | Where this service sits in the customer journey | Required |
| 3. Capability Reuse Search | Search results with consume/fork/new decisions | Required |
| 4. Demand & Capacity Profile | Volume, peaks, channels, capacity | Required |
| 5. As-Is Process Analysis | Current-state documentation | Conditional (only if replacing) |
| 6. Data Inventory | C/R/U/D actions on data elements | Required |
| 7. Stakeholder & Persona Map | Who reviews, approves, escalates | Required |

Sections 8–29 remain in template form for Stage 1+ to fill.

## Authoring Rules

1. **Fill tables; do not rewrite the structure.** The template defines the shape of each section.
2. **No invented facts.** Where data is missing, use `[SME INPUT REQUIRED]` and add the item to the Stage 0 risk log.
3. **Business language only.** Roles, decisions, evidence, controls — not platform configuration.
4. **Reuse search is mandatory.** Section 3 must show at least 3 search attempts against the Capability Catalogue Index. "Don't know if anything exists" is not acceptable — search the index.
5. **Section 5 is conditional.** Skip if there is no existing process being replaced. Note "N/A — greenfield service" in the section header.
6. **Volume estimates need a basis.** Section 4 asks for annual volume — provide the basis (historical data, comparable service, projected demand). Don't guess.

## Stage Gate (Exit)

Stage 0 is complete when:
- All Required sections (1, 2, 3, 4, 6, 7) are filled with real content (no `[SME INPUT REQUIRED]` blocks remaining, or each remaining block has a named owner and target date)
- Capability Reuse Search documents at least 3 searches with explicit decisions
- Service Owner has signed off on Section 1 (boundary and outcome)
- Manifest is committed to the service folder as `[ServiceID]_Manifest.docx`

## Common Mistakes to Avoid

| Mistake | Why it matters |
|---|---|
| Skipping Section 3 (reuse search) | Causes capability proliferation — top portfolio bloat driver |
| Skipping Section 4 (capacity) | OLAs become unenforceable when volume changes |
| Skipping Section 7 (personas) | Sign-off routing breaks at later stages |
| Filling Section 5 unnecessarily | Wastes effort on greenfield services |
| Inventing customer journey detail | Make explicit when journey context is unknown — add to risks |

## Handoff to Stage 1

Stage 1 picks up the manifest at Section 8 (Decomposition Decision). The Stage 0 sections are inputs to that decision — no other handoff documents needed.

## Self-Validation Before Delivering

Before declaring Stage 0 complete, verify:

| Check | Status |
|---|---|
| All Required sections have content | Y/N |
| Section 1 boundary in/out is specific (not vague) | Y/N |
| Section 3 shows ≥3 reuse searches | Y/N |
| Section 4 has volume figures with stated basis | Y/N |
| Section 7 has named individuals or named roles (not "TBD") | Y/N |
| Document committed as `[ServiceID]_Manifest.docx` | Y/N |

If any fails, return to authoring before declaring Stage 0 complete.

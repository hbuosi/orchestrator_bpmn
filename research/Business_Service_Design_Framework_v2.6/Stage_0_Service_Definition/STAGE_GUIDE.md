# Stage 0 — Service Definition — Execution Guide (v3.0)

## Goal

Produce **Sections 1–7 of the Service Manifest** for a single service. The manifest is the source of truth; this stage establishes who, what, why, and where the service sits in the customer journey.

## Stage Gate (Entry)

Do not start Stage 0 unless you have:
- A selected service row from the portfolio catalogue
- Access to the Capability Catalogue Index (`Shared/Capability_Catalogue_Index_v1.0.csv`)
- Access to supporting materials (policies, customer feedback, demand reports)

## Inputs to Upload

- The stage prompt (`Service_Definition_Prompt_v3.0.md`)
- The blank manifest template (`Templates/Service_Manifest_Template_v1.0.docx`)
- The Capability Catalogue Index
- The selected service row + supporting materials

## Output

A populated Service Manifest with Sections 1–7 complete:
- File: `[ServiceID]_Manifest.docx`
- Format: Word document
- Status: Stage 0 complete

## Review Gate (Exit)

Stage 0 is reviewed by:
- Service Owner (signs off on Section 1 boundary)
- Service Sponsor (confirms strategic fit)
- Capability librarian (confirms reuse search was thorough)

## What's Different from v2.5

| v2.5 | v2.6 |
|---|---|
| Service Card .docx + Intake Form .xlsx (two artifacts) | One Manifest .docx (Sections 1–7) |
| Reuse search was implicit / often skipped | Section 3 mandatory, with ≥3 documented searches |
| Customer journey context was implicit | Section 2 mandatory |
| Demand profile sometimes added later | Section 4 mandatory at Stage 0 |
| Personas/stakeholders sketched in Blueprint | Section 7 mandatory at Stage 0 |
| Data inventory often missing | Section 6 mandatory |

## Common Failure Modes

| Failure | Symptom | Fix |
|---|---|---|
| Skipping reuse search | Capability proliferation; portfolio bloat | Force Section 3 with ≥3 searches |
| Vague boundary | "Manages vendors" instead of specific in/out | Section 1 in/out scope must be lists, not paragraphs |
| Missing volume figures | OLAs unenforceable later | Section 4 requires figures with stated basis |
| `[SME INPUT REQUIRED]` left unowned | Stages slip waiting for resolution | Each unresolved item gets named owner + date |

## Self-Validation

Before declaring Stage 0 complete, run the validation checklist in `Service_Definition_Prompt_v3.0.md` Section "Self-Validation Before Delivering".

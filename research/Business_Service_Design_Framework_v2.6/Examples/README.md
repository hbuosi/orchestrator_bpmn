# Examples — Canonical Service Designs

This directory contains worked examples demonstrating the v2.6 framework. Each example shows a complete service or service family designed using the manifest-driven methodology.

## VND-FAM-001 — Vendor Onboarding Service Family

A composite service (Vendor Onboarding Package) plus 5 capability services. Demonstrates:

| Concept | Demonstrated by |
|---|---|
| Composite + Capability decomposition | VND-ONB001 calls VND-DD001, VND-FIN001, VND-SEC001, VND-CON001, VND-REG001 |
| Lane 1 = Caller Service for capabilities | All 5 capability CSVs |
| 9-stage Capability Service Skeleton | VND-DD001 follows it cleanly |
| Service-call shape labelling | `Run Due Diligence [5d]` with Module ID = `VND-DD001` |
| Service Family Index | `VND-FAM-001_Service_Family_Index.csv` |
| SLA Cascade arithmetic | Composite 10d SLA derives from parallel (5d) + sequential (5d + 1d) capability OLAs |
| All 12 Diagram Quality Rules | Every CSV passes |

### Files

| File | Service | Archetype |
|---|---|---|
| VND-ONB001_Workflow.csv | Vendor Onboarding Package | Composite |
| VND-DD001_Workflow.csv | Vendor Due Diligence | Capability |
| VND-FIN001_Workflow.csv | Financial Solvency Check | Capability |
| VND-SEC001_Workflow.csv | Security Clearance | Capability |
| VND-CON001_Workflow.csv | Contract Review & Approval | Capability |
| VND-REG001_Workflow.csv | ERP Vendor Registration | Capability |
| VND-FAM-001_Service_Family_Index.csv | Family relationship index | — |

### Validation Summary

All 6 CSVs pass v2.5+ Diagram Quality Rules:

| Service | Shapes | Lines | Lanes | Width | Status |
|---|---|---|---|---|---|
| VND-ONB001 | 20 | 21 | 6 | 20 cols | PASS |
| VND-DD001 | 16 | 17 | 5 | 16 cols | PASS |
| VND-FIN001 | 13 | 14 | 5 | 13 cols | PASS |
| VND-SEC001 | 13 | 14 | 5 | 13 cols | PASS |
| VND-CON001 | 14 | 15 | 5 | 14 cols | PASS |
| VND-REG001 | 14 | 15 | 4 | 14 cols | PASS |

Each capability is smaller than the composite (≤16 shapes vs 20). Capabilities are focused; composites orchestrate.

## CYB-IR001 — Cybersecurity Incident Response (orchestrator)

The Critical variant CSV is included as a single-page reference. The full 4-variant orchestrator would be authored as a multi-page CSV under v2.6 conventions.

### File

| File | Demonstrates |
|---|---|
| CYB-IR001_Critical_FirstTimeRight_Example.csv | Single variant; first-time-right Lucidchart import |

## How to Use These Examples

1. **For new service authoring**: open the example most similar to your service archetype (Capability / Composite / Orchestrating). Use it as a template structure.
2. **For Lucidchart import testing**: import any of the CSVs to validate your Lucidchart setup before authoring your own.
3. **For service family bundling**: see VND-FAM-001 for how to package a composite + capabilities + family index together.

## Caveat

These examples show the **Workflow CSV layer** of the manifest (Section 20). The full v2.6 manifest also contains 26 other sections covering identification, decomposition, SLA cascade, loop governance, etc. — those are authored using the prompts in `Stage_*` folders.

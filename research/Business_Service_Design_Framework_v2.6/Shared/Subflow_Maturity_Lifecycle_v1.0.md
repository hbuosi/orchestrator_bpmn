# Subflow Maturity Lifecycle (v1.0)

## Purpose

The Standard Subflow Library is empirically derived. Patterns enter as Candidates and progress through maturity stages as evidence accumulates. This document defines the lifecycle and what each state implies for designers consuming patterns.

## Maturity Stages

| Stage | Definition | Reuse Mandate | Service Designer Action |
|---|---|---|---|
| **Candidate** | Observed once; not yet a confirmed pattern | Optional | Note the candidate; don't enforce |
| **Provisional** | Observed in 2+ services; structurally similar but variants exist | Recommended | Use the pattern; document deviations |
| **Ratified** | Observed in 3+ services; signed off by portfolio governance | Mandatory unless justified | Use the pattern; deviation requires rationale |
| **Stable** | Operating in production for 6+ months across 3+ services with no structural change | Mandatory | Use the pattern; deviation requires senior sign-off |
| **Deprecated** | Pattern superseded by a newer one or no longer relevant | None — do not use | Use the replacement pattern |

## Progression Rules

**Candidate → Provisional**: When a second service shows the same pattern (subject to WCP-level structural test). Triggered by Stage 2 alignment work.

**Provisional → Ratified**: When a third service confirms the pattern AND portfolio governance signs off. Sign-off requires:
- WCP annotation completed
- 1-page pattern card written (purpose, parameters, anti-patterns)
- At least one Provisional consumption resolved without deviation
- Service Owner of all 3+ consuming services attest the pattern works

**Ratified → Stable**: After 6 months of operating production use across 3+ services with no structural changes. "Structural change" means the WCP annotation would be different. Parameter tuning (different OLAs, different roles) doesn't reset the clock.

**Any → Deprecated**: When governance ratifies a replacement OR the pattern is no longer relevant. Deprecation requires:
- Replacement pattern identified (or "no replacement — domain extinct")
- Migration guidance documented
- Sunset date for existing services

## Reuse Mandate Detail

### Candidate (Optional reuse)

Designers may use Candidate patterns but are not required to. The pattern is informational at this stage. If you do consume a Candidate, you contribute to its progression — the second use moves it toward Provisional.

### Provisional (Recommended reuse)

Designers should use Provisional patterns where applicable. Deviations are allowed but should be documented in Section 22 (Pattern Drift Notes). Pattern drift signals to library curators that the pattern definition may need refinement.

### Ratified (Mandatory unless justified)

Designers must use Ratified patterns where they apply. Deviation requires:
- Documented rationale in Section 22
- Service Owner sign-off on the deviation
- Notification to portfolio governance

Repeated Ratified deviations across services indicate the pattern needs evolution — governance may consider promoting a deviation as a new Ratified variant.

### Stable (Mandatory)

Designers must use Stable patterns. Deviation requires senior architecture sign-off and a formal exception in the manifest. Stable patterns are the bedrock of the platform — variation here causes portfolio-level instability.

### Deprecated (Do not use)

Deprecated patterns are not consumed by new services. Existing services using deprecated patterns are migrated per the sunset plan.

## Section 14 (Module Register) Integration

Every module in Section 14 of the Manifest declares the maturity of its aligned subflow:

| Module ID | Module Name | Aligned Subflow | Subflow Maturity |
|---|---|---|---|
| M-INT-01 | Intake | INT-Standard | Ratified |
| M-EXE-01 | Risk Screening | EXE-Screening-v2 | Provisional |
| M-COM-01 | Notifications | COM-M5-Standard | Stable |

If `Subflow Maturity = Provisional` or worse, Section 22 (Pattern Drift Notes) must address it.

## Library Governance Cadence

| Activity | Frequency |
|---|---|
| Candidate identification | Continuous (Stage 2 work) |
| Provisional review | Quarterly |
| Ratification | Quarterly (after 3+ services consume) |
| Stable promotion | Annual review |
| Deprecation | As-needed |

## Pattern Card Template

When a pattern moves from Provisional to Ratified, a 1-page pattern card is added to the library:

```
Pattern ID: [INT-Standard]
Maturity: Ratified
WCP Annotation: WCP-1, WCP-2
Purpose: [What the pattern does]
Structure: [Step sequence with Task Type Codes]
Parameters: [What's configurable: role, OLA, retry count]
Anti-patterns: [What this pattern is NOT for]
Consuming Services: [VND-ONB001, CYB-IR001, ...]
Last Modified: [Date]
Owner: [Library Curator role]
```

## Validation

When consuming a subflow pattern, verify:

| Check | Status |
|---|---|
| Pattern maturity recorded in Section 14 | Y/N |
| If Provisional or worse: deviation documented in Section 22 | Y/N |
| If Ratified: deviation has Service Owner sign-off | Y/N |
| If Stable: deviation has architecture sign-off | Y/N |
| Deprecated patterns: not used (replacement consumed instead) | Y/N |

## Tracking Reuse Rate

Portfolio-level KPI:

> **Subflow Reuse Rate** = (modules aligned to ≥Provisional patterns) / (total modules across portfolio)

Target: ≥75% across the portfolio. Below 60% indicates either insufficient library breadth or insufficient designer awareness of the library.

# Research — GSD Service Orchestrator

Compiled: 2026-05-12 | Sources: 22 | Confidence: High

## Index

| File | Topic | Key Decision |
|------|-------|--------------|
| [01-bpmn-color-standards.md](01-bpmn-color-standards.md) | BPMN in Color Spec (OMG 2014) | Green=happy, Orange=error, full palette |
| [02-bpmn-tools-comparison.md](02-bpmn-tools-comparison.md) | Tool landscape: bpmn.io vs others | **bpmn.io stack selected** |
| [03-json-intermediate-format.md](03-json-intermediate-format.md) | LLM → JSON → XML pipeline | **Never generate XML directly** |
| [04-service-card-standard.md](04-service-card-standard.md) | UAE TDRA + Abu Dhabi TAMM fields | 15 mandatory fields defined |
| [05-gsd-orchestrator-architecture.md](05-gsd-orchestrator-architecture.md) | GSD-2 pattern + document platforms | Agent isolation + SQLite state |
| [06-bpmn-best-practices.md](06-bpmn-best-practices.md) | Layout, naming, anti-patterns | Left-to-right, happy path spine |

## TL;DR — Key Findings

1. **No official color standard in BPMN 2.0 spec**, but BPMN in Color (OMG MIWG 2014) is the accepted interchange format. Green/orange convention is community-established and widely adopted.

2. **bpmn-auto-layout eliminates overlaps automatically** — feed it XML without DI, get back fully positioned, routed, sized diagram. No manual coordinate work needed.

3. **JSON intermediate format is 47% more reliable** than asking LLMs to generate XML directly (per peer-reviewed study). Pipeline: LLM → Zod JSON → bpmn-moddle XML → bpmn-auto-layout.

4. **UAE TDRA mandates 15 fields** for government service cards. Abu Dhabi TAMM adds life events, journey steps (max 7), and dependency graphs.

5. **GSD-2 architecture pattern** (fresh context per agent dispatch + SQLite state) prevents context degradation in long generation pipelines.

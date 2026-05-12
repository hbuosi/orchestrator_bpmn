# GSD Orchestrator Architecture

## GSD-2 (Get Stuff Done) — Reference Architecture

**Repo:** https://github.com/gsd-build/gsd-2  
**Type:** Meta-prompting + context engineering + spec-driven development

### Core Problem Solved
"Context rot" — quality degradation as the LLM's context window fills up. Solved by:
- Storing state in SQLite (authoritative)
- Each agent dispatch gets a **fresh context window** with only the relevant pre-inlined artifacts
- Complexity-based model routing (light/standard/heavy tiers)

### 13-Step Dispatch Pipeline
1. Derive project state from SQLite
2. Determine next unit type and ID
3. Classify complexity → select model tier
4. Apply budget pressure adjustments
5. Check routing history for adaptive tweaks
6. Dynamic model routing (if enabled)
7. Resolve effective model with fallbacks
8. Check pending captures → triage if needed
9. Build dispatch prompt with compression
10. Create fresh agent session
11. Inject prompt, let LLM execute
12. Snapshot metrics, verify artifacts, persist state
13. Loop to step 1

### 3 Bundled Agents
- **Scout** — fast codebase reconnaissance, compressed context
- **Researcher** — web research and information synthesis
- **Worker** — general-purpose execution in isolated contexts

### Persistent Artifact Files
```
.gsd/
  PROJECT.md
  REQUIREMENTS.md
  ROADMAP.md
  STATE.md
  CONTEXT.md
```

### SQLite Schema Key Tables
- `phases` — workflow phases
- `requirements` — functional requirements
- `decisions` — architecture decisions (memory)
- `memories` — pattern/gotcha knowledge base

---

## How We Apply This Pattern

Our orchestrator adapts the GSD pattern for document generation:

```
service-definition.json
        │
        ▼
  Orchestrator (state machine)
        │
   ┌────┼─────────────┐
   ▼    ▼             ▼
Scout  Worker      Worker
(validate         (generate   (generate
 input)            BPMN)       card)
        │             │
        └──────────────┘
               │
               ▼
         PDF Exporter
```

Each generator runs in isolation with only the data it needs.

---

## GSD-1 vs GSD-2

| Feature | GSD-1 | GSD-2 |
|---------|-------|-------|
| State storage | Markdown files | SQLite + Markdown projections |
| Agent isolation | Manual | Automatic per dispatch |
| Model routing | Manual | Complexity-based auto-routing |
| Verification | Manual | Automated gates (lint/test/typecheck) |
| Memory | CONTEXT.md | decisions + memories tables |

---

## Document Generation Platform Reference

| Platform | Type | Used By |
|----------|------|---------|
| Camunda 8 | Open-source BPMN engine | German federal agencies |
| Flowable | Open-source BPMN/CMMN | Swiss government |
| ServiceNow | Enterprise platform | UAE government agencies |
| Appian | Low-code | US federal (GSA, DoD) |
| FlowForma | AI-powered gov workflow | Local governments |
| Gotenberg | Docker PDF microservice | Any stack |
| Carbone.io | Template-based PDF/DOCX | Node.js projects |

# DGE Service Orchestrator — BPMN & Service Card Generator

Generates two documents from a single `service-definition.json`:

| Output | Description |
|--------|-------------|
| **Service Card** (HTML + PDF) | UAE TDRA / Abu Dhabi TAMM standard — 15 mandatory fields |
| **BPMN 2.0 Diagram** (XML + SVG + PDF + HTML) | Auto-layout (zero overlap), semantic colors, BPMN in Color Spec |

## Quick Start

```bash
# Install
bun install

# Copy env
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Generate all outputs from the trade license example
bun run generate examples/trade-license.service-definition.json

# Generate BPMN only
bun run generate:bpmn examples/trade-license.service-definition.json

# Generate Service Card only
bun run generate:card examples/trade-license.service-definition.json
```

Outputs land in `output/`:
```
output/
  tamm-tl-001-service-card.html
  tamm-tl-001-service-card.pdf
  tamm-tl-001-bpmn.xml
  tamm-tl-001-bpmn.svg
  tamm-tl-001-bpmn.pdf
  tamm-tl-001-bpmn-viewer.html
```

## Color Conventions (BPMN in Color Spec — OMG MIWG 2014)

| Color | Hex | Meaning |
|-------|-----|---------|
| Green | `#C8E6C9` / `#2E7D32` | Happy path — successful flow |
| Orange | `#FFE0B2` / `#E65100` | Errors, exceptions, rejections |
| Red | `#FFCDD2` / `#C62828` | Cancellation, termination |
| Blue | `#BBDEFB` / `#1565C0` | Automated service tasks |
| White | `#FAFAFA` / `#424242` | Human / manual tasks |

## Input Format

See [`examples/trade-license.service-definition.json`](examples/trade-license.service-definition.json) for a full example.

```json
{
  "version": "1.0",
  "serviceCard": { /* 15-field UAE TDRA standard */ },
  "bpmnProcess": {
    "id": "Process_1",
    "name": "My Process",
    "elements": [
      { "type": "startEvent", "id": "start", "label": "Application Submitted", "colorKey": "happy" },
      { "type": "serviceTask", "id": "task_1", "label": "Validate Documents", "colorKey": "system" },
      {
        "type": "exclusiveGateway", "id": "gw_1", "label": "Valid?",
        "branches": [
          { "condition": "Valid", "colorKey": "happy", "path": [ /* ... */ ] },
          { "condition": "Invalid", "colorKey": "error", "path": [ /* ... */ ] }
        ]
      }
    ]
  }
}
```

## Architecture

```
service-definition.json
        │
        ▼
  Zod validation
        │
   ┌────┴──────────────────┐
   ▼                       ▼
BPMN Pipeline           Service Card
   │                       │
   ├─ bpmn-moddle (XML)    ├─ HTML template
   ├─ bpmn-auto-layout     └─ Puppeteer → PDF
   ├─ applyColors (BPMN in Color Spec)
   ├─ SVG export (Puppeteer)
   └─ PDF export (Puppeteer A3 landscape)
```

## Stack

- **Runtime:** Bun
- **Language:** TypeScript strict
- **BPMN XML:** bpmn-moddle
- **Auto-layout:** bpmn-auto-layout (zero overlap)
- **Rendering:** bpmn-js (headless via Puppeteer)
- **PDF:** Puppeteer
- **LLM:** Claude API + Zod structured output
- **Validation:** bpmnlint

## Research

See [`research/`](research/README.md) for the full research compiled before implementation:
- BPMN color standards (OMG spec)
- Tool comparison
- JSON intermediate format rationale
- UAE TDRA service card standard
- DGE orchestrator architecture pattern
- BPMN modeling best practices

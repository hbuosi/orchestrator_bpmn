# GSD Service Orchestrator — CLAUDE.md

## Purpose

Orchestrator that generates two document types from a single `service-definition.json` input:
1. **Service Card** — HTML/PDF with structured government service metadata (UAE TDRA / Abu Dhabi TAMM standard)
2. **BPMN 2.0 Diagram** — flowchart with auto-layout (no overlap) and semantic color coding (green/orange/red)

All generation is programmatic. No manual diagram editing required. Output: PDF/A + SVG + standalone HTML.

---

## Stack (locked — do not deviate)

| Layer | Tool | Package |
|-------|------|---------|
| Runtime | Bun | - |
| Language | TypeScript strict | - |
| BPMN structure | JSON intermediate → XML | custom schema (see below) |
| BPMN XML parse/write | bpmn-moddle | `bpmn-moddle` |
| BPMN auto-layout | Eliminate all overlaps | `bpmn-auto-layout` |
| BPMN render | bpmn-js headless | `bpmn-js` |
| Color API | modeling.setColor() | bpmn-js Modeling module |
| PDF export | Puppeteer headless Chrome | `puppeteer` |
| LLM structured output | Claude API + Zod | `@anthropic-ai/sdk` + `zod` |
| Validation | bpmnlint | `bpmnlint` |

---

## Directory Structure

```
gsd-service-orchestrator/
├── CLAUDE.md
├── package.json
├── tsconfig.json
├── src/
│   ├── orchestrator.ts        # main entry point — reads input, runs pipeline
│   ├── schemas/
│   │   ├── service-definition.schema.ts   # Zod: input JSON schema
│   │   ├── bpmn-elements.schema.ts        # Zod: JSON intermediate for BPMN
│   │   └── service-card.schema.ts         # Zod: service card data model
│   ├── generators/
│   │   ├── bpmn-xml.generator.ts          # JSON → BPMN 2.0 XML (bpmn-moddle)
│   │   ├── bpmn-layout.ts                 # XML → laid-out XML (bpmn-auto-layout)
│   │   ├── bpmn-colors.ts                 # apply color conventions to BPMNDI
│   │   └── service-card.generator.ts      # service-definition → HTML
│   ├── exporters/
│   │   ├── pdf.exporter.ts                # HTML/SVG → PDF via Puppeteer
│   │   └── svg.exporter.ts                # bpmn-js → SVG string
│   ├── llm/
│   │   ├── claude.client.ts               # Anthropic SDK wrapper w/ prompt cache
│   │   └── bpmn-from-text.ts              # text description → JSON BPMN (structured output)
│   ├── templates/
│   │   ├── service-card.html.ts           # HTML template literal
│   │   └── bpmn-viewer.html.ts            # standalone HTML with embedded bpmn-js
│   └── constants/
│       └── colors.ts                      # BPMN color palette constants
├── examples/
│   └── trade-license.service-definition.json
└── output/                                # gitignored — generated files land here
```

---

## BPMN Color Palette (BPMN in Color Spec — OMG MIWG 2014)

```typescript
// src/constants/colors.ts
export const BPMN_COLORS = {
  happy:        { fill: '#C8E6C9', stroke: '#2E7D32' },  // green  — happy path
  error:        { fill: '#FFE0B2', stroke: '#E65100' },  // orange — errors/exceptions
  cancel:       { fill: '#FFCDD2', stroke: '#C62828' },  // red    — cancellation/termination
  compensation: { fill: '#FFF9C4', stroke: '#F57F17' },  // yellow — compensation flows
  system:       { fill: '#BBDEFB', stroke: '#1565C0' },  // blue   — automated/service tasks
  manual:       { fill: '#FAFAFA', stroke: '#424242' },  // white  — human/manual tasks
  subprocess:   { fill: '#EDE7F6', stroke: '#4527A0' },  // lavender — subprocesses
  lane_header:  { fill: '#1565C0', stroke: '#0D47A1', label: '#FFFFFF' },
} as const;
```

Colors are stored directly in BPMNDI XML via `color:background-color` / `color:border-color` attributes (BPMN in Color Spec). Also applied at render-time via `modeling.setColor()`.

---

## JSON Intermediate BPMN Format

LLM → structured JSON → bpmn-moddle → XML. Never ask LLM to generate XML directly.

```typescript
// src/schemas/bpmn-elements.schema.ts (Zod)
type BpmnElement =
  | { type: 'startEvent' | 'endEvent'; id: string; label: string; colorKey?: keyof typeof BPMN_COLORS }
  | { type: 'task' | 'userTask' | 'serviceTask' | 'scriptTask'; id: string; label: string; colorKey?: keyof typeof BPMN_COLORS }
  | { type: 'exclusiveGateway' | 'parallelGateway' | 'inclusiveGateway'; id: string; label: string;
      branches: Array<{ condition: string; path: BpmnElement[]; colorKey?: keyof typeof BPMN_COLORS }> }
  | { type: 'subProcess'; id: string; label: string; elements: BpmnElement[]; colorKey?: keyof typeof BPMN_COLORS }

type BpmnProcess = {
  id: string;
  name: string;
  participants?: Array<{ id: string; name: string; color?: string }>;
  elements: BpmnElement[];
}
```

---

## Service Card Schema (UAE TDRA / Abu Dhabi TAMM standard)

```typescript
// 15 mandatory fields per UAE Service Specifications Manual
type ServiceCard = {
  // Identity
  serviceCode: string;              // e.g. "TAMM-TL-001"
  nameEn: string;
  nameAr: string;
  category: 'life-event' | 'business' | 'informational';
  owningEntity: string;

  // Delivery
  channels: ('online' | 'app' | 'call-center' | 'in-person')[];
  targetSegment: ('citizen' | 'resident' | 'business' | 'visitor')[];
  
  // Process
  eligibilityCriteria: string[];
  requiredDocuments: Array<{ name: string; format?: string; notes?: string }>;
  journeySteps: Array<{ step: number; title: string; description: string; estimatedMinutes?: number }>;
  
  // Commercial
  fees: Array<{ channel: string; applicantType?: string; amountAED: number }>;
  slaDays: Record<string, number>;   // { online: 3, 'in-person': 5 }

  // Legal & Compliance
  legalBasis: string;
  transformationStage: 'paper' | 'digital' | 'smart' | 'proactive';
  uaePassEnabled: boolean;
  uaePassLevel?: 1 | 2 | 3;
  
  // Output
  outputDocuments: Array<{ name: string; format: string; validityDays?: number; deliveryMethod: string }>;
}
```

---

## Generation Pipeline

```
service-definition.json
        │
        ▼
  [orchestrator.ts]
        │
   ┌────┴────────────────────┐
   ▼                         ▼
[bpmn-xml.generator.ts]   [service-card.generator.ts]
   │                         │
   ▼                         ▼
[bpmn-layout.ts]          [HTML string]
   │                         │
   ▼                         ▼
[bpmn-colors.ts]          [pdf.exporter.ts → PDF]
   │
   ▼
[svg.exporter.ts → SVG]
   │
   ▼
[pdf.exporter.ts → PDF]
```

---

## BPMN Layout Rules (enforced programmatically)

- Flow direction: **left → right**
- Happy path: **central horizontal spine**, exceptions branch up/down
- bpmn-auto-layout handles all positioning — never hardcode coordinates
- Minimum element spacing: 30px (auto-layout default respects this)
- Long cross-diagram connections: use **Link Events**, not long sequence flows
- Task labels: max 4 words, verb+object format ("Validate Documents")
- Gateway labels: question format ("Documents Complete?")
- All gateways must have **labeled outgoing flows**

---

## Anti-Patterns (never do)

- Never ask LLM to generate BPMN XML directly — always go through JSON intermediate
- Never hardcode DI coordinates — always use `bpmn-auto-layout`
- Never use Swimlanes within a single Pool — use separate Pools for distinct participants
- Never omit Start/End events
- Never use more than 4 colors per diagram
- Never embed base64 images in BPMN XML
- Never call `Modeling#setColor` before `importXML` resolves

---

## Key Commands

```bash
bun run generate <input.json>           # generate all outputs
bun run generate:bpmn <input.json>      # BPMN only
bun run generate:card <input.json>      # service card only
bun run validate <input.json>           # validate against schemas
bun run preview                         # open output in browser
bun test                                # run tests
```

---

## Claude API Usage (prompt caching enabled)

```typescript
// Always use extended thinking for complex BPMN generation
// Always enable prompt caching for system prompt (>1024 tokens)
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 8096,
  system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
  messages: [{ role: 'user', content: userInput }],
});
```

---

## Output File Naming Convention

```
output/
  {serviceCode}-service-card.html
  {serviceCode}-service-card.pdf
  {serviceCode}-bpmn.xml
  {serviceCode}-bpmn.svg
  {serviceCode}-bpmn.pdf
  {serviceCode}-bpmn-viewer.html     # standalone, embeds bpmn-js + XML
```

---

## Research Sources (key references)

- BPMN in Color Spec: https://github.com/bpmn-miwg/bpmn-in-color
- bpmn-auto-layout: https://github.com/bpmn-io/bpmn-auto-layout
- bpmn-moddle: https://github.com/bpmn-io/bpmn-moddle
- bpmn-js colors example: https://github.com/bpmn-io/bpmn-js-examples/tree/main/colors
- Camunda readable models: https://docs.camunda.io/docs/components/best-practices/modeling/creating-readable-process-models/
- BPMN Assistant (JSON→BPMN architecture reference): https://github.com/jtlicardo/bpmn-assistant
- UAE TDRA standards: https://u.ae/en/about-the-uae/digital-uae/digital-government
- Abu Dhabi TAMM: https://www.tamm.abudhabi

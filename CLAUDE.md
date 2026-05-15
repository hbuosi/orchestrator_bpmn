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
| BPMN XML parse/write | Custom generator (no moddle) | `bpmn-xml.generator.ts` |
| BPMN layout | Custom recursive engine (no bpmn-auto-layout) | `bpmn-xml.generator.ts` |
| BPMN render | bpmn-navigated-viewer (CDN @18.16.0) | `bpmn-js` |
| Color API | bioc: + color: XML attributes (regex injection) | `bpmn-colors.ts` |
| PDF export CLI | Puppeteer headless Chrome | `puppeteer` |
| PDF export browser | SVG → blob URL → window.print() (BPMN); innerHTML → blob (Card) | in-template JS |
| LLM structured output | Claude API + Zod + self-correction loop | `@anthropic-ai/sdk` + `zod` |
| Web app | Next.js 14 App Router + SSE streaming | `next` |
| Validation | bpmnlint | `bpmnlint` |

### Web App (Vercel)
- URL: https://web-three-blush-94.vercel.app
- Entry: `web/` directory — Next.js, no Puppeteer
- API route: `POST /api/generate` → SSE stream → combined HTML
- Env var required: `ANTHROPIC_API_KEY`

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
│   │   ├── service-card.html.ts           # HTML template — standalone government style card
│   │   ├── bpmn-viewer.html.ts            # standalone BPMN viewer (navigated-viewer@18)
│   │   └── combined-viewer.html.ts        # ★ PRIMARY — two-column editorial: card + BPMN
│   └── constants/
│       └── colors.ts                      # BPMN color palette constants
├── examples/
│   ├── emirates-id.service-definition.json
│   └── uae-visa-renewal.service-definition.json
├── output/                                # gitignored — generated files land here
└── web/                                   # Next.js web app (Vercel)
    ├── app/
    │   ├── page.tsx                       # form UI + SSE progress + iframe result
    │   ├── layout.tsx
    │   └── api/generate/route.ts          # SSE streaming API → combined HTML
    └── lib/                               # mirrors src/ without Puppeteer deps
        ├── constants/colors.ts
        ├── schemas/
        ├── generators/
        └── templates/combined-viewer.html.ts
```

---

## BPMN Color Palette (BPMN in Color Spec — OMG MIWG 2014)

```typescript
// src/constants/colors.ts
export const BPMN_COLORS = {
  happy:        { fill: '#E8F5E9', stroke: '#2E7D32' },  // green       — start / happy path
  happy_end:    { fill: '#C8E6C9', stroke: '#1B5E20' },  // dark green  — success end event
  error:        { fill: '#FFE0B2', stroke: '#E65100' },  // orange      — exceptions / warnings
  cancel:       { fill: '#FFCDD2', stroke: '#C62828' },  // red         — cancellation / error end
  compensation: { fill: '#FFF9C4', stroke: '#F57F17' },  // yellow      — compensation flows
  system:       { fill: '#E0F7FA', stroke: '#00838F' },  // teal        — automated service tasks
  manual:       { fill: '#F3E5F5', stroke: '#6A1B9A' },  // purple      — human / user tasks
  decision:     { fill: '#E3F2FD', stroke: '#1565C0' },  // blue        — gateways / decisions
  subprocess:   { fill: '#EDE7F6', stroke: '#4527A0' },  // lavender    — subprocesses
  lane_header:  { fill: '#1565C0', stroke: '#0D47A1', labelColor: '#FFFFFF' },
  default:      { fill: '#FFFFFF', stroke: '#333333' },
} as const;
```

Colors are stored in BPMNDI XML via both:
- `color:background-color` / `color:border-color` — OMG MIWG 2014 spec (persistent, tool-agnostic)
- `bioc:fill` / `bioc:stroke` — bpmn-io legacy format (written alongside for bpmn-js compatibility)

Both are written by `bpmn-colors.ts` post-processing step. If `colorKey` is omitted in JSON, color is auto-inferred from element type: `startEvent→happy`, `endEvent→happy_end`, `serviceTask/scriptTask→system`, `userTask→manual`, `*Gateway→decision`, `subProcess→subprocess`.

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
- Happy path: **central horizontal spine** (ORIGIN_Y = 240), exceptions branch up/down
- Custom recursive `layoutPath()` in `bpmn-xml.generator.ts` handles all positioning — no bpmn-auto-layout
- Generates both `BPMNShape` and `BPMNEdge` (with L-shaped waypoints) in one pass
- Converging gateway auto-created only when non-terminal branches exist (end events never connect to merge)
- Task labels: max 4 words, verb+object format ("Validate Documents")
- Gateway labels: question format ("Documents Complete?")
- All gateways must have **labeled outgoing flows** (condition field on each branch)

### Label Overlap Prevention (critical — never skip)

All sequence flow condition labels must be positioned **off** the flow line and **never overlap** element boxes.
Two constants control this:

| Constant | Value | Purpose |
|----------|-------|---------|
| `GAP_X` | 60 | Horizontal gap between regular sequential elements |
| `BRANCH_GAP_X` | 150 | Wider gap: gateway right edge → first branch element; creates a safe corridor for condition labels |

Label placement algorithm (`labelBounds()` in `bpmn-xml.generator.ts`):

- **Straight (horizontal) flow**: label centered above the line midpoint (`y - 28px`)
- **L-shaped (gateway→branch) flow**: label anchored to the **first horizontal segment** (x1→midX), never on the vertical segment
  - Up-branches (`y2 < y1`): label ABOVE the outgoing horizontal → `y = y1 - lh - 6`
  - Down-branches (`y2 > y1`): label BELOW the outgoing horizontal → `y = y1 + 6`
  - `availW = midX - x1 - 8` — usable width of first horizontal segment
  - Label width: `min(max(rawW, 30), max(availW, 30))`
  - Height: 28px when `rawW > availW` (2-line wrap), else 16px
  - Converging flows (branch → join gateway) never have labels, so this only applies to diverging (gateway → branch)

Both `src/generators/bpmn-xml.generator.ts` and `web/lib/generators/bpmn-xml.generator.ts` **must stay in sync** — any change to either file must be applied to both.

---

## Anti-Patterns (never do)

- Never ask LLM to generate BPMN XML directly — always go through JSON intermediate
- Never use `bpmn-auto-layout` or `bpmn-moddle` — replaced by custom generator
- Never use `moddle.fromXML → toXML` round-trip for color injection — it drops BPMNEdge elements
- Never use Swimlanes within a single Pool — use separate Pools for distinct participants
- Never omit Start/End events
- Never use `estimatedMinutes: null` in journeySteps — omit the field if unknown
- Never embed base64 images in BPMN XML
- Never call `Modeling#setColor` before `importXML` resolves
- Never use `waitUntil: 'networkidle0'` in `page.setContent()` — only valid for `page.goto()`

---

## Key Commands

```bash
# CLI (Bun)
bun run generate <input.json>           # generate all outputs from JSON
bun run generate:from-text "..."        # generate from natural language (needs ANTHROPIC_API_KEY)
bun run generate:bpmn <input.json>      # BPMN only
bun run generate:card <input.json>      # service card only
bun run validate <input.json>           # validate against schemas
bun run preview                         # open output in browser
bun test                                # run tests

# Web app (Next.js)
cd web && npm run dev                   # local dev server
cd web && vercel --prod                 # deploy to Vercel
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
  {serviceCode}-combined.html        # ★ PRIMARY — two-column editorial: card left + BPMN right
  {serviceCode}-combined.pdf         # A3 landscape (Puppeteer, CLI only)
  {serviceCode}-service-card.html    # standalone government service card (UAE TDRA style)
  {serviceCode}-service-card.pdf
  {serviceCode}-bpmn.xml             # BPMN 2.0 XML with bioc: + color: attributes
  {serviceCode}-bpmn.svg
  {serviceCode}-bpmn.pdf
  {serviceCode}-bpmn-viewer.html     # standalone BPMN viewer with toolbar
```

`bun run preview` opens `{code}-combined.html` first (falls back to bpmn-viewer → service-card → any HTML).

## Export Buttons in Combined Viewer

| Button | What it exports |
|--------|----------------|
| ↓ BPMN PDF | BPMN diagram only — A3 landscape via SVG → blob → window.print() |
| ↓ SVG | BPMN diagram as SVG file download |
| ↓ BPMN XML | BPMN 2.0 XML file download |
| ↓ Card PDF | Service Card only — A4 portrait via innerHTML → blob → window.print() |

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

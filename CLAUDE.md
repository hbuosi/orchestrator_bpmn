# DGE Service Orchestrator — CLAUDE.md

## Purpose

AI-powered orchestrator that transforms a government service description (plain text or spreadsheet) into structured technical documentation following the **Business Service Design Framework v2.6** (Abu Dhabi DGE).

Three generation modes:

| Mode | Output | API call(s) |
|------|--------|-------------|
| **Service Card + BPMN** | Combined single-page viewer: service card + BPMN 2.0 diagram | 1 |
| **Full Manifest — Single Pass** | 5 separate PDF-ready documents covering all §1–27 | 1 |
| **Full Manifest — Stage by Stage** | 4 stage documents generated sequentially with review gates; complete manifest auto-generated after Stage 3 | 4 |

All generation is AI-driven (Claude API) with Zod schema validation and a self-correction retry loop. No manual editing required. Output: standalone HTML files with built-in PDF export (`window.print()`).

---

## Stack (locked — do not deviate)

| Layer | Tool | Package |
|-------|------|---------|
| Runtime | Bun | - |
| Language | TypeScript strict | - |
| BPMN structure | JSON intermediate → XML | custom schema |
| BPMN XML parse/write | Custom generator (no moddle) | `bpmn-xml.generator.ts` |
| BPMN layout | Custom recursive engine (no bpmn-auto-layout) | `bpmn-xml.generator.ts` |
| BPMN render | bpmn-navigated-viewer (CDN @18.16.0) | `bpmn-js` |
| Color API | bioc: + color: XML attributes (regex injection) | `bpmn-colors.ts` |
| PDF export CLI | Puppeteer headless Chrome | `puppeteer` |
| PDF export browser | `window.print()` via blob URL | in-template JS |
| LLM structured output | Claude API + Zod + self-correction loop | `@anthropic-ai/sdk` + `zod` |
| Web app | Next.js 14 App Router + SSE streaming | `next` |
| Validation | bpmnlint | `bpmnlint` |

### Web App (Vercel)
- **URL**: https://web-three-blush-94.vercel.app
- **Entry**: `web/` directory — Next.js, no Puppeteer
- **API route**: `POST /api/generate` → SSE stream
- **Env var required**: `ANTHROPIC_API_KEY`

---

## Directory Structure

```
orchestrator_bpmn/
├── CLAUDE.md
├── GUIA_ESPECIALISTA.md               # system orientation guide (English)
├── package.json
├── tsconfig.json
├── src/                               # CLI pipeline (Bun — not deployed)
│   ├── orchestrator.ts
│   ├── schemas/
│   │   ├── service-definition.schema.ts
│   │   ├── bpmn-elements.schema.ts
│   │   └── service-card.schema.ts
│   ├── generators/
│   │   ├── bpmn-xml.generator.ts      # ★ keep in sync with web/lib/generators/
│   │   ├── bpmn-colors.ts
│   │   └── service-card.generator.ts
│   ├── exporters/
│   │   ├── pdf.exporter.ts
│   │   └── svg.exporter.ts
│   └── templates/
│       ├── service-card.html.ts
│       ├── bpmn-viewer.html.ts
│       └── combined-viewer.html.ts
├── research/
│   └── Business_Service_Design_Framework_v2.6/  # framework source docs
└── web/                               # Next.js web app (Vercel — primary)
    ├── app/
    │   ├── page.tsx                   # UI: mode selector, input, progress, result links
    │   ├── layout.tsx
    │   └── api/generate/route.ts      # SSE API — all three generation modes
    └── lib/
        ├── constants/colors.ts
        ├── schemas/
        │   ├── service-definition.schema.ts
        │   ├── bpmn-elements.schema.ts
        │   └── manifest.schema.ts     # ★ Zod: ServiceManifest v2.6 (Stage0–3)
        ├── generators/
        │   ├── bpmn-xml.generator.ts  # ★ keep in sync with src/generators/
        │   └── bpmn-colors.ts
        ├── parsers/
        │   └── excel.parser.ts        # xlsx/csv/ods → structured text
        ├── validators/
        │   └── bpmn-structure.validator.ts
        └── templates/
            ├── manifest-shared.ts         # shared CSS, docHeader(), sectionHeader(), badges
            ├── combined-viewer.html.ts    # Service Card + BPMN mode output
            ├── stage0-manifest.html.ts    # §1–7 Service Definition
            ├── stage1-manifest.html.ts    # §8–13 Service Design
            ├── stage2-manifest.html.ts    # §14–22 Task Model + embedded BPMN viewer
            ├── stage3-manifest.html.ts    # §23–27 Build-Ready Requirements
            └── complete-manifest.html.ts  # §1–27 unified with sidebar navigation
```

---

## AI Model Strategy

All three generation modes use the same retry strategy:

| Attempt | Model | Notes |
|---------|-------|-------|
| 1–2 | `claude-opus-4-7` | Primary — most capable |
| 3–4 | `claude-sonnet-4-6` | Fallback — used if Opus fails |

- SSE heartbeat every 4 seconds keeps the UI responsive during streaming.
- JSON validated against Zod schema after each attempt.
- BPMN structure validated separately (disconnected flows, empty branches, gateway violations).
- Max tokens vary by mode: Service Card 6,000–16,000 / Manifest Single 8,000–32,000 / Manifest Stage 6,000–16,000.

---

## API Route — `POST /api/generate`

### Request body

```typescript
// Service Card + BPMN
{ mode: 'service-card', text: string }

// Full Manifest — Single Pass
{ mode: 'manifest-single', text: string }

// Full Manifest — Stage by Stage
{
  mode: 'manifest-stage',
  text: string,
  stage: 0 | 1 | 2 | 3,
  previousStages?: { stage0?: Stage0; stage1?: Stage1; stage2?: Stage2 }
}

// File upload (multipart/form-data)
FormData: { file: File, mode: string }
```

### SSE events emitted

```typescript
{ type: 'progress', step: number, message: string }

// Service Card mode
{ type: 'complete', html: string }

// Single Pass mode
{ type: 'manifest_complete', outputs: {
    stage0: string; stage1: string; stage2: string; stage3: string; complete: string
  }
}

// Stage by Stage mode (stages 0–2)
{ type: 'stage_complete', stage: number, html: string, manifest: StageN }

// Stage 3 also includes the complete manifest
{ type: 'stage_complete', stage: 3, html: string, manifest: Stage3, completeHtml?: string }

{ type: 'error', message: string }
```

---

## Service Manifest v2.6 Schema

Defined in `web/lib/schemas/manifest.schema.ts`. Each stage is a separate Zod schema, all composed into `ServiceManifestSchema`.

```
ServiceManifest
├── version: '2.6'
├── stage0: Stage0        §1–7   Service Definition
│   ├── serviceIdentification
│   ├── customerJourneyContext
│   ├── capabilityReuseSearch   (min 3 entries)
│   ├── demandProfile
│   ├── dataInventory
│   └── stakeholderMap
├── stage1: Stage1        §8–13  Service Design
│   ├── decompositionDecision   (archetype: Capability | Composite | Orchestrating)
│   ├── serviceBoundary
│   ├── valueStream             (3–7 phases)
│   ├── outcomeTargets          (stated vs computed SLA + OLA cascade)
│   ├── auditDrivers
│   └── lifecycleStage
├── stage2: Stage2        §14–22 Task Model & Workflow
│   ├── moduleRegister          (MOD-01, MOD-02 ...)
│   ├── taskRegister            (T01, T02 ... with digitizationMode + automationCandidate)
│   ├── loopGovernance
│   ├── workflowDiagram         (BpmnProcess — same schema as Service Card mode)
│   └── subflowAlignment        (WCP codes)
└── stage3: Stage3        §23–27 Build-Ready Requirements
    ├── buildHandoff
    │   ├── dataContracts
    │   ├── integrationPoints
    │   └── automationCandidates
    ├── kpiInheritance
    ├── operatingModel          (raci + cadence)
    ├── acceptanceCriteria
    └── risksOpenQuestions
```

**Key enum constraints** (Zod will reject anything else):
- `stage0.serviceIdentification.category`: `'life-event' | 'business' | 'informational'`
- `stage0.demandProfile.channels`: `'online' | 'app' | 'call-center' | 'in-person'`
- `stage0.stakeholderMap[].type`: `'reviewer' | 'approver' | 'escalation' | 'informed' | 'operator'`
- `stage1.decompositionDecision.archetype`: `'Capability' | 'Composite' | 'Orchestrating'`
- `stage1.decompositionDecision.smellTests[].result`: `'pass' | 'fail' | 'n/a'`
- `stage1.outcomeTargets.olaBreakdown[].executionMode`: `'Sequential' | 'Parallel'`
- `stage1.lifecycleStage.stage`: `'Designing' | 'Implementing' | 'Operating' | 'Retiring'`
- `stage2.taskRegister[].digitizationMode`: `'automated' | 'assisted' | 'manual'`
- `stage2.taskRegister[].subflowMaturity` (via module): `'Candidate' | 'Provisional' | 'Ratified' | 'Stable' | 'Deprecated'`
- `stage2.loopGovernance[].type`: `'Resubmission' | 'Rework' | 'Negotiation'`
- `stage2.loopGovernance[].clockPolicy`: `'Stop' | 'Continue' | 'Mixed'`
- `stage3.buildHandoff.dataContracts[].direction`: `'Inbound' | 'Outbound'`
- `stage3.buildHandoff.integrationPoints[].direction`: `'Outbound' | 'Inbound' | 'Bidirectional'`
- `stage3.kpiInheritance[].frequency`: `'Daily' | 'Weekly' | 'Monthly'`
- `stage3.buildHandoff.automationCandidates[].phase`: `'Phase 1' | 'Phase 2'`
- `stage3.risksOpenQuestions[].type`: `'Risk' | 'Issue' | 'Decision needed' | 'Open question'`

---

## BPMN Color Palette (BPMN in Color Spec — OMG MIWG 2014)

```typescript
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

Colors written as both `color:background-color`/`color:border-color` (OMG spec) and `bioc:fill`/`bioc:stroke` (bpmn-js legacy) by `bpmn-colors.ts`. Color auto-inferred from element type when `colorKey` is omitted.

---

## JSON Intermediate BPMN Format

LLM → structured JSON → custom XML generator. **Never ask LLM to generate BPMN XML directly.**

```typescript
type BpmnElement =
  | { type: 'startEvent' | 'endEvent'; id: string; label: string; colorKey?: keyof typeof BPMN_COLORS }
  | { type: 'task' | 'userTask' | 'serviceTask' | 'scriptTask'; id: string; label: string; colorKey?: keyof typeof BPMN_COLORS }
  | { type: 'exclusiveGateway' | 'parallelGateway' | 'inclusiveGateway'; id: string; label: string;
      branches: Array<{ condition: string; path: BpmnElement[] }> }
  | { type: 'subProcess'; id: string; label: string; elements: BpmnElement[]; colorKey?: keyof typeof BPMN_COLORS }

type BpmnProcess = {
  id: string;
  name: string;
  participants?: Array<{ id: string; name: string; color?: string }>;
  elements: BpmnElement[];
}
```

This same `BpmnProcess` type is used for both the Service Card mode (`bpmnProcess` field) and the Stage 2 manifest (`workflowDiagram` field).

---

## Service Card Schema (UAE TDRA / Abu Dhabi TAMM standard)

```typescript
type ServiceCard = {
  serviceCode: string;
  nameEn: string;
  nameAr: string;
  category: 'life-event' | 'business' | 'informational';
  owningEntity: string;
  channels: ('online' | 'app' | 'call-center' | 'in-person')[];
  targetSegment: ('citizen' | 'resident' | 'business' | 'visitor')[];
  eligibilityCriteria: string[];
  requiredDocuments: Array<{ name: string; format?: string; notes?: string }>;
  journeySteps: Array<{ step: number; title: string; description: string; estimatedMinutes?: number }>;
  fees: Array<{ channel: string; applicantType?: string; amountAED: number }>;
  slaDays: Record<string, number>;
  legalBasis: string;
  transformationStage: 'paper' | 'digital' | 'smart' | 'proactive';
  uaePassEnabled: boolean;
  uaePassLevel?: 1 | 2 | 3;
  outputDocuments: Array<{ name: string; format: string; validityDays?: number; deliveryMethod: string }>;
}
```

---

## BPMN Layout Rules (enforced programmatically)

- Flow direction: **left → right**
- Happy path: **central horizontal spine** (ORIGIN_Y = 240), exceptions branch up/down
- Custom recursive `layoutPath()` in `bpmn-xml.generator.ts` — no bpmn-auto-layout
- Generates both `BPMNShape` and `BPMNEdge` (with L-shaped waypoints) in one pass
- Task labels: max 4 words, verb+object format ("Validate Documents")
- Gateway labels: question format ("Documents Complete?")
- All gateways must have **labeled outgoing flows**

### Label Overlap Prevention (critical — never skip)

| Constant | Value | Purpose |
|----------|-------|---------|
| `GAP_X` | 60 | Horizontal gap between regular sequential elements |
| `BRANCH_GAP_X` | 150 | Gateway right edge → first branch element; safe corridor for condition labels |

Label placement (`labelBounds()` in `bpmn-xml.generator.ts`):
- **Straight flow**: label centered above midpoint (`y - 28px`)
- **L-shaped (gateway→branch)**: label on first horizontal segment only — never on vertical segment
  - Up-branch: `y = y1 - lh - 6`; Down-branch: `y = y1 + 6`

**Both `src/generators/bpmn-xml.generator.ts` and `web/lib/generators/bpmn-xml.generator.ts` must stay in sync — any change to either must be applied to both.**

---

## BPMN Structural Rules (validated after every AI generation)

Violations cause broken diagrams. The validator in `bpmn-structure.validator.ts` enforces:

1. **Every branch must terminate** — each `branch.path` ends with `{type:"endEvent"}` unless it is the single happy-path continuation branch.
2. **At most one open branch per gateway** — only one branch may omit an end event.
3. **No empty branch paths** — every `branch.path` has at least one task.
4. **Maximum 3 gateway nesting levels** — flatten deeper nesting by terminating the deep branch and continuing at a higher level.
5. **Unique element IDs** — never reuse IDs across elements.
6. **Task labels**: verb+object, 4 words max.
7. **Gateway labels**: question format ending in `?`.
8. **Branch conditions**: 1–2 words max ("Yes", "No", "Valid", "Approved").

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
- Never change the `manifest-shared.ts` CSS without verifying all 4 stage templates still render correctly

---

## Key Commands

```bash
# Web app (Next.js — primary)
cd web && npm run dev                   # local dev server (http://localhost:3000)
cd web && npm run test:run              # run unit tests (Vitest — 79 tests)
cd web && npx tsc --noEmit             # type check
cd web && vercel --prod                 # deploy to Vercel production

# CLI (Bun — secondary, not deployed)
bun run generate <input.json>
bun run generate:from-text "..."
bun test
```

---

## Manifest HTML Templates

All templates share the same CSS and helpers from `manifest-shared.ts`:
- `esc(s)` — HTML escape
- `bool(v)` — ✓ / —
- `docHeader(opts)` — navy header with DGE branding, stage badge, service code, date
- `sectionHeader(num, title)` — `§N` numbered section header
- `maturityBadge`, `digitizationBadge`, `riskBadge` — coloured inline badges

Stage colour mapping:
- Stage 0: `#2E7D32` (green)
- Stage 1: `#1565C0` (blue)
- Stage 2: `#E65100` (orange)
- Stage 3: `#6A1B9A` (purple)

Each template exports one function:
```typescript
stage0ManifestTemplate(data: Stage0): string
stage1ManifestTemplate(data: Stage1, serviceCode: string): string
stage2ManifestTemplate(data: Stage2, bpmnXml: string, serviceCode: string): string
stage3ManifestTemplate(data: Stage3, serviceCode: string): string
completeManifestTemplate(manifest: ServiceManifest, bpmnXml: string): string
```

---

## Export Buttons per Document

| Document | Export button | Method |
|----------|--------------|--------|
| Service Card + BPMN | ↓ BPMN PDF | SVG → blob → `window.print()` |
| Service Card + BPMN | ↓ SVG | SVG file download |
| Service Card + BPMN | ↓ BPMN XML | XML file download |
| Service Card + BPMN | ↓ Card PDF | innerHTML → blob → `window.print()` |
| Stage 0 / 1 / 3 | ↓ Export Stage N PDF | `window.print()` |
| Stage 2 | ↓ BPMN PDF + ↓ SVG + ↓ BPMN XML + ↓ Export Stage 2 PDF | same as above |
| Complete Manifest | ↓ Export Complete Manifest PDF | `window.print()` |

---

## Research Sources

- BPMN in Color Spec: https://github.com/bpmn-miwg/bpmn-in-color
- bpmn-js colors example: https://github.com/bpmn-io/bpmn-js-examples/tree/main/colors
- Camunda readable models: https://docs.camunda.io/docs/components/best-practices/modeling/creating-readable-process-models/
- BPMN Assistant (JSON→BPMN architecture reference): https://github.com/jtlicardo/bpmn-assistant
- UAE TDRA standards: https://u.ae/en/about-the-uae/digital-uae/digital-government
- Abu Dhabi TAMM: https://www.tamm.abudhabi

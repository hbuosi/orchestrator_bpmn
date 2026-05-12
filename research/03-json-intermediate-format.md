# JSON Intermediate Format for BPMN Generation

## Why JSON, Not XML

From academic study (BPMN Assistant, arxiv 2509.24592v1):

| Metric | JSON | XML |
|--------|------|-----|
| Generation similarity | Similar | Similar |
| Editing success rate | **0.51** | 0.35 |
| Avg processing latency | **21.46s** | 46.98s |
| Reliability | Higher | Lower |

**Conclusion:** Always use JSON as the intermediate format between LLM and BPMN XML.

---

## JSON Schema (this project)

```typescript
// Defined in src/schemas/bpmn-elements.schema.ts

type BpmnElement =
  | Task          // task, userTask, serviceTask, scriptTask, manualTask...
  | Event         // startEvent, endEvent, intermediateCatchEvent...
  | Gateway       // exclusiveGateway, parallelGateway, inclusiveGateway
  | SubProcess    // collapsed subProcess with nested elements

type Gateway = {
  type: 'exclusiveGateway' | 'parallelGateway' | 'inclusiveGateway';
  id: string;
  label: string;
  colorKey?: ColorKey;
  branches: Array<{
    condition: string;       // label for the outgoing flow
    colorKey?: ColorKey;     // color for this path
    path: BpmnElement[];     // elements in this branch
  }>;
}
```

---

## Pipeline

```
Input text / service-definition.json
          │
          ▼
  Claude API (structured output, Zod schema)
          │
          ▼
  BpmnProcess JSON (validated by Zod)
          │
          ▼
  bpmn-moddle → BPMN 2.0 XML (no DI)
          │
          ▼
  bpmn-auto-layout → XML with full DI (no overlap)
          │
          ▼
  applyColors → XML with BPMN in Color attributes
          │
     ┌────┴────┐
     ▼         ▼
  SVG export  PDF export
  (Puppeteer) (Puppeteer A3 landscape)
```

---

## Self-Correction Loop (when using LLM)

1. LLM generates JSON
2. Zod validates structure
3. If invalid → feed error back to LLM with: `"Your output had these validation errors: [...]. Please fix and return valid JSON."`
4. Max 3 retries before throwing

**Source:** https://arxiv.org/html/2509.24592v1 (BPMN Assistant validation approach)

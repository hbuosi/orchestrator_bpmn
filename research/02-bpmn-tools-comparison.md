# BPMN Tools Comparison

## Stack Decision: bpmn.io Ecosystem (locked)

After evaluating all major tools, the bpmn.io ecosystem is the best fit for programmatic generation.

---

## bpmn.io Ecosystem

### bpmn-js
- BPMN 2.0 rendering + modeler in the browser
- SVG-based rendering
- Extensible via plugins
- `modeling.setColor()` API for colors
- Watermark must remain visible (license constraint)
- **Source:** https://github.com/bpmn-io/bpmn-js

### bpmn-moddle
- Read and write BPMN 2.0 XML from JavaScript objects
- The bridge between JS data structures and BPMN XML
- Used by bpmn-js internally
- **Source:** https://github.com/bpmn-io/bpmn-moddle

### bpmn-auto-layout
- Takes BPMN XML without Diagram Interchange (DI) info
- Outputs fully laid-out XML with element positions, sizes, connection routing
- **Zero overlap guaranteed by design**
- Based on: "A Simple Algorithm for Automatic Layout of BPMN Processes" (IEEE 2009)
- Requires Node.js 18+, works in browser too
- **Does NOT layout:** Groups, Text Annotations, Associations, Message Flows
- **Source:** https://github.com/bpmn-io/bpmn-auto-layout
- **Demo:** https://bpmn-io.github.io/bpmn-auto-layout/

### bpmn-visualization (Process Analytics)
- TypeScript library, read-only visualization
- Styling via CSS classes or `updateStyle()` API
- BPMN in Color Spec supported (v0.35.0+)
- Better for displaying execution state overlays
- Uses mxGraph rendering (vs bpmn-js SVG)
- **Less suitable for our use case** (we need generation, not just display)
- **Source:** https://github.com/process-analytics/bpmn-visualization-js

---

## Desktop/SaaS Tools

| Tool | Best For | Color Support | Free Tier |
|------|----------|---------------|-----------|
| **Camunda Modeler** | Enterprise BPMN + execution | BPMN in Color | Yes |
| **draw.io / diagrams.net** | Free, embeddable, open-source | Full custom | Yes (open-source) |
| **Lucidchart** | Collaboration, teams | Custom colors | Limited |
| **Bizagi Modeler** | BPMN best practice reference | Limited | Yes |
| **Visual Paradigm** | Enterprise, all notations | Full | Paid |
| **Signavio** | SAP ecosystem, process mining | Full | Paid |

---

## AI BPMN Generators (reference implementations)

### patchley.com
AI BPMN generator (SaaS): https://www.patchley.com/

### eraser.io
AI diagram generator with BPMN support: https://www.eraser.io/ai/bpmn-diagram-generator

### BPMN Assistant (open-source reference)
- LLM-powered BPMN generation
- **Architecture we adopted:** JSON intermediate → XML → bpmn-auto-layout
- Python backend + Vue frontend + Node.js layout server
- **Source:** https://github.com/jtlicardo/bpmn-assistant
- **Paper:** https://arxiv.org/html/2509.24592v1

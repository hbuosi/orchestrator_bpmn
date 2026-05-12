# BPMN 2.0 Color Standards

## Specification: BPMN in Color (OMG MIWG 2014)

Adopted by the OMG BPMN Model Interchange Working Group as the official standard for color interchange between BPMN tools.

**Repo:** https://github.com/bpmn-miwg/bpmn-in-color  
**Tools supporting it:** bpmn-js (v8.7+), Camunda Modeler, Trisotech, Software AG ARIS

### XML Attributes (BPMNDI extension)
```xml
<bpmndi:BPMNShape 
  color:background-color="#C8E6C9"
  color:border-color="#2E7D32">
```

| Attribute | Description |
|-----------|-------------|
| `color:background-color` | Fill color |
| `color:border-color` | Stroke/border color |
| `color:color` | Label/text color |

---

## Color Palette (Project Standard)

| Key | Fill | Stroke | Usage |
|-----|------|--------|-------|
| `happy` | `#C8E6C9` | `#2E7D32` | Happy path — successful flow |
| `error` | `#FFE0B2` | `#E65100` | Errors, exceptions, rejections |
| `cancel` | `#FFCDD2` | `#C62828` | Cancellations, terminations |
| `compensation` | `#FFF9C4` | `#F57F17` | Compensation flows |
| `system` | `#BBDEFB` | `#1565C0` | Automated service tasks |
| `manual` | `#FAFAFA` | `#424242` | Human / manual tasks |
| `subprocess` | `#EDE7F6` | `#4527A0` | Subprocesses |
| `lane_header` | `#1565C0` | `#0D47A1` | Pool/lane headers |

---

## OMG BPMN 2.0 Spec on Colors
The official spec does NOT mandate colors. Start events conventionally green ("go"), end events red ("stop"). Everything else is community convention.

**Source:** http://www.omg.org/spec/BPMN/2.0/

---

## Camunda Best Practices
- "Avoid excessive use of colors" — max 3-4 per diagram
- Happy path: central straight spine, left-to-right, no branching
- Exceptions branch up/down from the central spine
- Labels on all gateway outgoing flows

**Source:** https://docs.camunda.io/docs/components/best-practices/modeling/creating-readable-process-models/

---

## bpmn-js API for Colors

```javascript
// Apply at render time (does not persist unless using Option 2)
const modeling = bpmnModeler.get('modeling');
modeling.setColor([element1, element2], { stroke: '#2E7D32', fill: '#C8E6C9' });

// Remove colors
modeling.setColor(elements, null);
```

**4 approaches to coloring in bpmn-js:**
1. CSS overlays (jQuery, not persistent)
2. BPMN 2.0 XML extension (persistent — recommended)
3. CSS markers (runtime only)
4. Custom renderer (dynamic, advanced)

**Source:** https://bpmn.io/blog/posts/2016-colors-bpmn-js.html

# BPMN 2.0 Best Practices

## Layout Rules

### Direction & Flow
- Always **left → right** (natural reading direction)
- Happy path: **central horizontal spine**, straight sequence flows
- Exception/error paths: branch **up or down** from the spine
- Use **Link Events** for long cross-diagram connections (avoids lines crossing the whole diagram)

### Element Sizing (minimum)
- Task: 100px × 80px
- Gateway: 50px × 50px  
- Event: 36px × 36px
- Spacing between elements: ≥ 30px

### Naming Conventions
| Element | Format | Example |
|---------|--------|---------|
| Task | Verb + Object | "Validate Documents" |
| Event | Noun + State | "License Issued" |
| Gateway | Question | "Documents Valid?" |
| Sequence Flow | Condition | "Valid" / "Invalid" |

---

## What to Model

### Show in BPMN
- Business-related problems (cause different business paths)
- Happy path + explicitly modeled exceptions
- Human decision points
- External system interactions (as service tasks)
- Timer-based flows (boundary timer events)

### Do NOT Show in BPMN
- Technical retry logic (belongs in code)
- Infrastructure failover (belongs in architecture)
- Logging and monitoring (belongs in ops)

---

## Anti-Patterns to Avoid

| Anti-pattern | Problem | Fix |
|-------------|---------|-----|
| Swimlanes within one Pool | Adds complexity without value | Use separate Pools for distinct participants |
| No labels on gateway flows | Reader can't understand routing | Label ALL outgoing gateway flows |
| Missing Start/End events | Diagram is incomplete | Always include both |
| Too many colors (>4) | Confusing, no semantic meaning | Max 4 colors per diagram |
| Hardcoded DI coordinates | Overlap inevitable, not portable | Use bpmn-auto-layout |
| Direct XML from LLM | High error rate, slow | Use JSON intermediate |
| Long sequence flows crossing diagram | Unreadable | Use Link Events |

---

## Modeling Exception Handling

### Tools available (BPMN 2.0)

1. **Exclusive Gateway (XOR)** — known decision outcomes
   - Use when: you know all possible results of an activity
   
2. **Boundary Error Event** — interrupting failures
   - Use when: task execution fails and cannot continue
   
3. **Boundary Timer Event (non-interrupting)** — timeouts
   - Use when: waiting too long without disrupting main flow
   
4. **Event Subprocess (interrupting)** — global process-level events
   - Use when: customer cancellation can happen at any point
   
5. **Event Subprocess (non-interrupting)** — parallel handling
   - Use when: status inquiry can happen at any point without stopping

---

## Sources
- https://docs.camunda.io/docs/components/best-practices/modeling/creating-readable-process-models/
- https://docs.camunda.io/docs/components/best-practices/modeling/modeling-beyond-the-happy-path/
- https://help.bizagi.com/process-modeler/en/best_practices_in_modeling.htm
- https://camunda.com/bpmn/reference/

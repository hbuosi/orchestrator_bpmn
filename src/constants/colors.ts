// BPMN in Color Specification (OMG MIWG 2014) + bioc compatibility layer
// Both color: (spec) and bioc: (bpmn-io legacy) are written to XML for max tool support
export const BPMN_COLORS = {
  happy:        { fill: '#E8F5E9', stroke: '#2E7D32' },  // green  — start / happy path
  happy_end:    { fill: '#C8E6C9', stroke: '#1B5E20' },  // dark green — success end event
  error:        { fill: '#FFE0B2', stroke: '#E65100' },  // orange — exceptions / warnings
  cancel:       { fill: '#FFCDD2', stroke: '#C62828' },  // red    — cancellation / error end
  compensation: { fill: '#FFF9C4', stroke: '#F57F17' },  // yellow — compensation flows
  system:       { fill: '#E0F7FA', stroke: '#00838F' },  // teal   — automated service tasks
  manual:       { fill: '#F3E5F5', stroke: '#6A1B9A' },  // purple — human / user tasks
  decision:     { fill: '#E3F2FD', stroke: '#1565C0' },  // blue   — gateways / decisions
  subprocess:   { fill: '#EDE7F6', stroke: '#4527A0' },  // lavender — subprocesses
  lane_header:  { fill: '#1565C0', stroke: '#0D47A1', labelColor: '#FFFFFF' },
  default:      { fill: '#FFFFFF', stroke: '#333333' },
} as const;

export type ColorKey = keyof typeof BPMN_COLORS;

// Flow (sequence flow) stroke colors by semantic meaning
export const FLOW_COLORS = {
  happy:  '#2E7D32',
  error:  '#E65100',
  cancel: '#C62828',
  default: '#333333',
} as const;

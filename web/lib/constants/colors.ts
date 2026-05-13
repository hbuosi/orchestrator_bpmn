export const BPMN_COLORS = {
  happy:        { fill: '#E8F5E9', stroke: '#2E7D32' },
  happy_end:    { fill: '#C8E6C9', stroke: '#1B5E20' },
  error:        { fill: '#FFE0B2', stroke: '#E65100' },
  cancel:       { fill: '#FFCDD2', stroke: '#C62828' },
  compensation: { fill: '#FFF9C4', stroke: '#F57F17' },
  system:       { fill: '#E0F7FA', stroke: '#00838F' },
  manual:       { fill: '#F3E5F5', stroke: '#6A1B9A' },
  decision:     { fill: '#E3F2FD', stroke: '#1565C0' },
  subprocess:   { fill: '#EDE7F6', stroke: '#4527A0' },
  lane_header:  { fill: '#1565C0', stroke: '#0D47A1', labelColor: '#FFFFFF' },
  default:      { fill: '#FFFFFF', stroke: '#333333' },
} as const;

export type ColorKey = keyof typeof BPMN_COLORS;

export const FLOW_COLORS = {
  happy:  '#2E7D32',
  error:  '#E65100',
  cancel: '#C62828',
  default: '#333333',
} as const;

// BPMN in Color Specification (OMG MIWG 2014)
// https://github.com/bpmn-miwg/bpmn-in-color
export const BPMN_COLORS = {
  happy:        { fill: '#C8E6C9', stroke: '#2E7D32' },
  error:        { fill: '#FFE0B2', stroke: '#E65100' },
  cancel:       { fill: '#FFCDD2', stroke: '#C62828' },
  compensation: { fill: '#FFF9C4', stroke: '#F57F17' },
  system:       { fill: '#BBDEFB', stroke: '#1565C0' },
  manual:       { fill: '#FAFAFA', stroke: '#424242' },
  subprocess:   { fill: '#EDE7F6', stroke: '#4527A0' },
  lane_header:  { fill: '#1565C0', stroke: '#0D47A1', labelColor: '#FFFFFF' },
  default:      { fill: '#FFFFFF', stroke: '#333333' },
} as const;

export type ColorKey = keyof typeof BPMN_COLORS;

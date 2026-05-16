import { describe, it, expect } from 'vitest';
import { validateBpmnElements } from '@/lib/validators/bpmn-structure.validator';
import type { BpmnElement } from '@/lib/schemas/bpmn-elements.schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const task = (id: string): BpmnElement => ({ type: 'serviceTask', id, label: id });
const end  = (id: string): BpmnElement => ({ type: 'endEvent',    id, label: id });

function gw(id: string, branches: { condition: string; path: BpmnElement[] }[]): BpmnElement {
  return { type: 'exclusiveGateway', id, label: `${id}?`, branches };
}

// ─── Empty branch paths ───────────────────────────────────────────────────────

describe('validateBpmnElements — empty branch paths (Rule 3)', () => {
  it('returns an error when a branch path is empty', () => {
    const elements: BpmnElement[] = [
      gw('gw_1', [
        { condition: 'Yes', path: [task('t1'), end('end_ok')] },
        { condition: 'No',  path: [] },
      ]),
    ];
    const errors = validateBpmnElements(elements);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('gw_1');
    expect(errors[0]).toContain('"No"');
    expect(errors[0]).toContain('EMPTY');
  });

  it('returns errors for every empty branch when multiple are empty', () => {
    const elements: BpmnElement[] = [
      gw('gw_1', [
        { condition: 'A', path: [] },
        { condition: 'B', path: [] },
      ]),
    ];
    const errors = validateBpmnElements(elements);
    const emptyErrors = errors.filter(e => e.includes('EMPTY'));
    expect(emptyErrors).toHaveLength(2);
  });

  it('returns no error when all branch paths are non-empty', () => {
    const elements: BpmnElement[] = [
      gw('gw_1', [
        { condition: 'Yes', path: [task('t1'), end('end_ok')] },
        { condition: 'No',  path: [task('t2'), end('end_err')] },
      ]),
    ];
    expect(validateBpmnElements(elements)).toHaveLength(0);
  });
});

// ─── Open branches (Rule 2) ───────────────────────────────────────────────────

describe('validateBpmnElements — multiple open branches (Rule 2)', () => {
  it('returns an error when gateway has 2 branches both without endEvent', () => {
    const elements: BpmnElement[] = [
      gw('gw_1', [
        { condition: 'Yes', path: [task('t1')] },
        { condition: 'No',  path: [task('t2')] },
      ]),
    ];
    const errors = validateBpmnElements(elements);
    const openErr = errors.find(e => e.includes('branches without endEvent'));
    expect(openErr).toBeTruthy();
    expect(openErr).toContain('gw_1');
    expect(openErr).toContain('2 branches');
  });

  it('allows exactly 1 open branch (happy-path continuation)', () => {
    const elements: BpmnElement[] = [
      gw('gw_1', [
        { condition: 'Yes', path: [task('t1')] },             // open — happy path
        { condition: 'No',  path: [task('t2'), end('e1')] },  // terminal
      ]),
    ];
    const errors = validateBpmnElements(elements);
    const openErr = errors.find(e => e.includes('branches without endEvent'));
    expect(openErr).toBeUndefined();
  });

  it('reports all open branch condition names in the error message', () => {
    const elements: BpmnElement[] = [
      gw('gw_1', [
        { condition: 'Alpha',   path: [task('ta')] },
        { condition: 'Beta',    path: [task('tb')] },
        { condition: 'Gamma',   path: [task('tc')] },
      ]),
    ];
    const errors = validateBpmnElements(elements);
    const openErr = errors.find(e => e.includes('branches without endEvent'));
    expect(openErr).toContain('"Alpha"');
    expect(openErr).toContain('"Beta"');
    expect(openErr).toContain('"Gamma"');
  });

  it('counts an empty-path branch as open when computing open-branch count', () => {
    // empty path → open; plus one more open branch = 2 open total
    const elements: BpmnElement[] = [
      gw('gw_1', [
        { condition: 'Yes', path: [task('t1')] },  // open
        { condition: 'No',  path: [] },            // empty (also open)
      ]),
    ];
    const errors = validateBpmnElements(elements);
    const openErr = errors.find(e => e.includes('branches without endEvent'));
    expect(openErr).toBeTruthy();
  });
});

// ─── Depth limit (Rule 4) ─────────────────────────────────────────────────────

describe('validateBpmnElements — nesting depth limit (Rule 4)', () => {
  it('returns no error for a gateway at depth 0 (top level)', () => {
    const elements: BpmnElement[] = [
      gw('gw_1', [
        { condition: 'Yes', path: [task('t1'), end('e1')] },
        { condition: 'No',  path: [task('t2'), end('e2')] },
      ]),
    ];
    expect(validateBpmnElements(elements)).toHaveLength(0);
  });

  it('returns no error for a gateway at depth 2 (3 levels deep)', () => {
    const deep2 = gw('gw_3', [
      { condition: 'Yes', path: [task('t3'), end('e3')] },
      { condition: 'No',  path: [task('t4'), end('e4')] },
    ]);
    const deep1 = gw('gw_2', [
      { condition: 'Yes', path: [deep2] },
      { condition: 'No',  path: [task('t5'), end('e5')] },
    ]);
    const elements: BpmnElement[] = [
      gw('gw_1', [
        { condition: 'Yes', path: [deep1] },
        { condition: 'No',  path: [task('t6'), end('e6')] },
      ]),
    ];
    // depth 0 = gw_1, depth 1 = gw_2, depth 2 = gw_3 — all allowed
    expect(validateBpmnElements(elements)).toHaveLength(0);
  });

  it('returns an error for a gateway at depth 3 (4 levels deep)', () => {
    const depth3 = gw('gw_4', [
      { condition: 'Yes', path: [task('t_a'), end('e_a')] },
      { condition: 'No',  path: [task('t_b'), end('e_b')] },
    ]);
    const depth2 = gw('gw_3', [
      { condition: 'Yes', path: [depth3] },
      { condition: 'No',  path: [task('t_c'), end('e_c')] },
    ]);
    const depth1 = gw('gw_2', [
      { condition: 'Yes', path: [depth2] },
      { condition: 'No',  path: [task('t_d'), end('e_d')] },
    ]);
    const elements: BpmnElement[] = [
      gw('gw_1', [
        { condition: 'Yes', path: [depth1] },
        { condition: 'No',  path: [task('t_e'), end('e_e')] },
      ]),
    ];
    const errors = validateBpmnElements(elements);
    const depthErr = errors.find(e => e.includes('levels deep'));
    expect(depthErr).toBeTruthy();
    expect(depthErr).toContain('gw_4');
    expect(depthErr).toContain('4 levels deep');
  });
});

// ─── Recursion into branch paths ──────────────────────────────────────────────

describe('validateBpmnElements — recursion into nested branches', () => {
  it('reports errors found inside nested branch paths', () => {
    const innerGw = gw('inner_gw', [
      { condition: 'A', path: [] },              // empty — error
      { condition: 'B', path: [task('tb'), end('eb')] },
    ]);
    const elements: BpmnElement[] = [
      gw('outer_gw', [
        { condition: 'Yes', path: [task('t1'), innerGw] },
        { condition: 'No',  path: [task('t2'), end('e2')] },
      ]),
    ];
    const errors = validateBpmnElements(elements);
    const emptyErr = errors.find(e => e.includes('inner_gw') && e.includes('EMPTY'));
    expect(emptyErr).toBeTruthy();
  });

  it('includes the full gateway path in the error message', () => {
    const innerGw = gw('inner_gw', [
      { condition: 'A', path: [] },
      { condition: 'B', path: [task('tb'), end('eb')] },
    ]);
    const elements: BpmnElement[] = [
      gw('outer_gw', [
        { condition: 'Yes', path: [task('t1'), innerGw] },
        { condition: 'No',  path: [task('t2'), end('e2')] },
      ]),
    ];
    const errors = validateBpmnElements(elements);
    const emptyErr = errors.find(e => e.includes('inner_gw'));
    // gwPath should reflect nesting: root→outer_gw→Yes
    expect(emptyErr).toContain('root→outer_gw→Yes');
  });
});

// ─── Non-gateway elements are ignored ────────────────────────────────────────

describe('validateBpmnElements — non-gateway elements', () => {
  it('returns no errors for a flat list of tasks and events', () => {
    const elements: BpmnElement[] = [
      { type: 'startEvent',   id: 'start', label: 'Start' },
      { type: 'serviceTask',  id: 't1',    label: 'Do Thing' },
      { type: 'endEvent',     id: 'end',   label: 'End' },
    ];
    expect(validateBpmnElements(elements)).toHaveLength(0);
  });

  it('returns no errors for an empty elements array', () => {
    expect(validateBpmnElements([])).toHaveLength(0);
  });
});

// ─── Valid complex structure ──────────────────────────────────────────────────

describe('validateBpmnElements — valid complex structure', () => {
  it('returns no errors for the canonical example from the system prompt', () => {
    const elements: BpmnElement[] = [
      { type: 'startEvent',  id: 'start',  label: 'Start',            colorKey: 'happy' },
      { type: 'serviceTask', id: 'task_1', label: 'Validate Application', colorKey: 'system' },
      gw('gw_1', [
        {
          condition: 'Yes',
          path: [
            { type: 'userTask', id: 'task_2', label: 'Review by Officer', colorKey: 'manual' },
            gw('gw_2', [
              {
                condition: 'Approved',
                path: [
                  { type: 'serviceTask', id: 'task_3', label: 'Issue Certificate', colorKey: 'system' },
                  end('end_ok'),
                ],
              },
              {
                condition: 'Rejected',
                path: [
                  { type: 'serviceTask', id: 'task_4', label: 'Notify Rejection', colorKey: 'error' },
                  { type: 'endEvent', id: 'end_reject', label: 'Application Rejected', colorKey: 'cancel' },
                ],
              },
            ]),
          ],
        },
        {
          condition: 'No',
          path: [
            { type: 'serviceTask', id: 'task_5', label: 'Return for Correction', colorKey: 'error' },
            { type: 'endEvent', id: 'end_invalid', label: 'Returned to Applicant', colorKey: 'cancel' },
          ],
        },
      ]),
    ];
    expect(validateBpmnElements(elements)).toHaveLength(0);
  });
});

import type { BpmnElement, BpmnBranch } from '@/lib/schemas/bpmn-elements.schema';

/**
 * Validates BPMN element structures for issues the layout engine cannot handle:
 * - Empty branch paths
 * - Gateways with more than 1 open (non-endEvent) branch
 * - Gateways nested at depth >= 3
 */
export function validateBpmnElements(elements: BpmnElement[], depth = 0, gwPath = 'root'): string[] {
  const errors: string[] = [];

  for (const el of elements) {
    if (!('branches' in el)) continue;

    const gw = el as Extract<BpmnElement, { branches: BpmnBranch[] }>;

    for (const branch of gw.branches) {
      if (!branch.path || branch.path.length === 0) {
        errors.push(
          `Gateway "${gw.id}" (${gwPath}) branch "${branch.condition}" is EMPTY. ` +
          `Add at least one task + endEvent.`
        );
        continue;
      }

      const last = branch.path[branch.path.length - 1]!;
      if (last.type !== 'endEvent') {
        const innerErrors = validateBpmnElements(branch.path, depth + 1, `${gwPath}→${gw.id}→${branch.condition}`);
        errors.push(...innerErrors);
      } else {
        errors.push(...validateBpmnElements(branch.path, depth + 1, `${gwPath}→${gw.id}→${branch.condition}`));
      }
    }

    // Count open (non-terminal) branches
    const openBranches = gw.branches.filter(b => {
      if (!b.path || b.path.length === 0) return true;
      const last = b.path[b.path.length - 1]!;
      return last.type !== 'endEvent';
    });

    if (openBranches.length > 1) {
      errors.push(
        `Gateway "${gw.id}" (${gwPath}) has ${openBranches.length} branches without endEvent: ` +
        `[${openBranches.map(b => `"${b.condition}"`).join(', ')}]. ` +
        `ONLY 1 open branch allowed (happy-path). ` +
        `Add endEvent to all other branches immediately.`
      );
    }

    if (depth >= 3) {
      errors.push(
        `Gateway "${gw.id}" (${gwPath}) is ${depth + 1} levels deep. ` +
        `Maximum allowed is 3 levels deep. ` +
        `FLATTEN: instead of nesting inside a branch, make it a sequential gateway that comes AFTER ` +
        `a converging merge — or terminate the deep branch with an endEvent and re-open at a higher level.`
      );
    }
  }

  return errors;
}

import type { Stage2 } from '../schemas/manifest.schema';
import { esc, bool, MANIFEST_CSS, docHeader, sectionHeader, maturityBadge, digitizationBadge } from './manifest-shared';
import { validateDiagramQualityRules, getExpectedLaneOrder, measureDiagramColumns, type QualityRuleResult } from '../validators/diagram-quality.validator';

function escBpmn(xml: string): string {
  return xml.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

type DiagramEl = { type: string; id: string; branches?: Array<{ path: DiagramEl[] }>; elements?: DiagramEl[] };

function collectDiagramElementIds(elements: DiagramEl[]): Set<string> {
  const taskTypes = new Set(['task', 'userTask', 'serviceTask', 'scriptTask']);
  const ids = new Set<string>();
  for (const el of elements) {
    if (taskTypes.has(el.type)) ids.add(el.id);
    if (el.branches) for (const b of el.branches) collectDiagramElementIds(b.path).forEach(id => ids.add(id));
    if (el.elements) collectDiagramElementIds(el.elements).forEach(id => ids.add(id));
  }
  return ids;
}

function qualityStatusBadge(r: QualityRuleResult): string {
  if (r.status === 'pass') return '<span class="badge pass">✓ PASS</span>';
  if (r.status === 'fail') return '<span class="badge mat-deprecated" style="background:#c62828;color:#fff">✗ FAIL</span>';
  if (r.status === 'advisory') return '<span class="badge mat-candidate" style="background:#e65100;color:#fff">⚠ Advisory</span>';
  return '<span class="badge" style="background:#78909c;color:#fff">N/A</span>';
}

export function stage2ManifestTemplate(data: Stage2, bpmnXml: string, serviceCode: string, workflowCsv?: string, archetype?: string, bpmnXmlVariants?: Array<{ tier: string; xml: string }>): string {
  const escaped = escBpmn(bpmnXml);
  const escapedCsv = workflowCsv ? escBpmn(workflowCsv) : '';
  const escapedVariants = bpmnXmlVariants?.map(v => ({ tier: v.tier, xml: escBpmn(v.xml) })) ?? [];
  const hasVariants = escapedVariants.length > 0;
  const diagramTaskIds = collectDiagramElementIds(data.workflowDiagram.elements as DiagramEl[]);
  const qualityResults = validateDiagramQualityRules(
    data.workflowDiagram as Parameters<typeof validateDiagramQualityRules>[0],
    { archetype, tiersCount: data.severityTierReconciliation?.length ?? 0, hasVariants },
  );
  const colCount = measureDiagramColumns(data.workflowDiagram.elements as Parameters<typeof measureDiagramColumns>[0]);
  const colLimit = archetype === 'Capability' ? 16 : 20;
  const colCss = colCount > colLimit + 5 ? 'color:#c62828;font-weight:700' : colCount > colLimit ? 'color:#e65100;font-weight:600' : 'color:var(--s0);font-weight:700';
  const standardResults = qualityResults.filter(r => r.rule <= 12 || r.rule === 18);
  const skeletonResults = qualityResults.filter(r => r.rule >= 13 && r.rule <= 17);
  const passCount = standardResults.filter(r => r.status === 'pass').length;
  const failCount = standardResults.filter(r => r.status === 'fail').length;
  const advisoryCount = standardResults.filter(r => r.status === 'advisory').length;
  const naCount = standardResults.filter(r => r.status === 'na').length;
  const summaryStatus = failCount > 0 ? 'fail' : advisoryCount > 0 ? 'advisory' : 'pass';
  const summaryCss = summaryStatus === 'fail' ? 'color:#c62828;font-weight:700' : summaryStatus === 'advisory' ? 'color:#e65100;font-weight:600' : 'color:var(--s0);font-weight:700';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(serviceCode)} — Stage 2 Task Model & Workflow</title>
<link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.16.0/dist/assets/diagram-js.css">
<link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.16.0/dist/assets/bpmn-js.css">
<link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.16.0/dist/assets/bpmn-font/css/bpmn.css">
${MANIFEST_CSS}
<style>
.bpmn-wrap { width:100%; height:560px; border:1px solid var(--rule); background:#fafaf6; position:relative; }
#diagram-s2 { width:100%; height:100%; }
.bpmn-btns { display:flex; gap:8px; margin-top:8px; }
.bpmn-btn { font-family:"JetBrains Mono",monospace; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.08em; padding:6px 14px; background:var(--navy); color:#fff; border:none; cursor:pointer; }
.bpmn-btn.outline { background:transparent; color:var(--navy); border:1.5px solid var(--navy); }
@media print { .bpmn-btns { display:none; } }
.variant-tabs { display:flex; gap:4px; margin-bottom:0; border-bottom:2px solid var(--rule); }
.tab-btn { font-family:"JetBrains Mono",monospace; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; padding:7px 16px; background:transparent; color:var(--muted); border:none; cursor:pointer; border-bottom:3px solid transparent; margin-bottom:-2px; }
.tab-btn.active { color:var(--navy); border-bottom-color:var(--navy); }
.tab-btn:hover:not(.active) { color:var(--navy); background:var(--bg); }
.variant-panel.hidden { display:none; }
</style>
</head>
<body>

${docHeader({
  serviceCode,
  title: 'Task Model & Workflow',
  subtitle: 'Module Register, Task Register & BPMN Diagram',
  stageBadge: 'Stage 2 — Task Model & Workflow',
  stageClass: 's2',
  sections: '§14–22',
})}

<!-- §14 Module Register -->
<div class="section">
  ${sectionHeader('14', 'Module Register')}
  <table>
    <thead><tr><th>Module ID</th><th>Module Name</th><th>Category</th><th>Core/Elective</th><th>Aligned Subflow</th><th>Subflow Maturity</th><th>Module OLA</th><th>Digitization Target</th></tr></thead>
    <tbody>
      ${data.moduleRegister.map(m => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(m.moduleId)}</td>
        <td><strong>${esc(m.name)}</strong></td>
        <td>${esc(m.category) || '—'}</td>
        <td>${esc(m.coreOrElective) || '—'}</td>
        <td>${esc(m.alignedSubflow)}</td>
        <td>${maturityBadge(m.subflowMaturity)}</td>
        <td style="font-family:monospace">${esc(m.ola)}</td>
        <td>${m.digitizationTarget ? digitizationBadge(m.digitizationTarget) : '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- §15 Task Register -->
<div class="section page-break">
  ${sectionHeader('15', 'Task Register')}
  <p style="font-style:italic;color:var(--muted);font-size:12px;margin-bottom:20px">One record per business task — vertical layout for readability.</p>
  ${data.taskRegister.map((t, i) => `
  <div style="margin-bottom:24px;border:1px solid var(--rule);${i % 2 === 0 ? '' : ''}">
    <div style="background:var(--s2);color:#fff;padding:8px 14px;font-family:monospace;font-size:11px;font-weight:600;display:flex;gap:16px;align-items:center">
      <span>${esc(t.taskId)}</span>
      <span style="opacity:.7">·</span>
      <span>${esc(t.name)}</span>
      <span style="margin-left:auto">${digitizationBadge(t.digitizationMode)}</span>
    </div>
    <table style="margin:0">
      <thead><tr><th style="width:220px">Field</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Task ID</td><td style="font-family:monospace">${esc(t.taskId)}</td></tr>
        <tr><td>Task Name</td><td><strong>${esc(t.name)}</strong></td></tr>
        <tr><td>Module ID</td><td style="font-family:monospace">${esc(t.moduleId)}</td></tr>
        <tr><td>Task Type Code</td><td style="font-family:monospace">${esc(t.taskTypeCode)}</td></tr>
        <tr><td>Purpose / Outcome</td><td>${esc(t.description)}</td></tr>
        <tr><td>Trigger</td><td>${esc(t.trigger) || '—'}</td></tr>
        <tr><td>Inputs</td><td>${esc(t.inputs) || '—'}</td></tr>
        <tr><td>Outputs / Evidence</td><td>${esc(t.outputsEvidence) || '—'}</td></tr>
        <tr><td>Primary Role (R)</td><td>${esc(t.lane)}</td></tr>
        <tr><td>Approver Role (A)</td><td>${esc(t.approverRole) || '—'}</td></tr>
        <tr><td>Business Rules / Decision Logic</td><td>${esc(t.businessRules) || '—'}</td></tr>
        <tr><td>OLA (full form)</td><td>${esc(t.olaFull)}</td></tr>
        <tr><td>OLA (compact for diagram)</td><td style="font-family:monospace">${esc(t.olaCompact)}</td></tr>
        <tr><td>SLA Clock Impact</td><td>${esc(t.slaClockImpact) || '—'}</td></tr>
        <tr><td>Capacity Assumption</td><td>${esc(t.capacityAssumption)}</td></tr>
        <tr><td>Digitization Mode</td><td>${digitizationBadge(t.digitizationMode)}</td></tr>
        <tr><td>Automation Candidate</td><td>${t.automationCandidate ? '✓ Yes' : '✗ No'}</td></tr>
      </tbody>
    </table>
  </div>`).join('')}
</div>

<!-- §16 Loop Governance -->
${data.loopGovernance.length > 0 ? `
<div class="section">
  ${sectionHeader('16', 'Loop Governance')}
  <table>
    <thead><tr><th>Loop ID</th><th>Loop Type</th><th>Re-entry Task ID</th><th>Max Cycles</th><th>Timeout</th><th>Escalation Path</th><th>Clock Policy</th><th>Reason Codes</th></tr></thead>
    <tbody>
      ${data.loopGovernance.map(l => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(l.loopId)}</td>
        <td>${esc(l.type)}</td>
        <td style="font-family:monospace">${esc(l.reentryTaskId)}</td>
        <td style="text-align:center;font-weight:700">${esc(l.maxCycles)}</td>
        <td style="font-family:monospace">${esc(l.timeout)}</td>
        <td style="font-size:11px">${esc(l.escalationPath)}</td>
        <td><span class="badge mat-candidate">${esc(l.clockPolicy)}</span></td>
        <td style="font-size:11px">${l.reasonCodes && l.reasonCodes.length > 0 ? l.reasonCodes.map(rc => `<span class="tag">${esc(rc)}</span>`).join(' ') : '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>` : ''}

<!-- §17 Exception Pathway Audit -->
<div class="section">
  ${sectionHeader('17', 'Exception Pathway Audit')}
  <table>
    <thead><tr><th>Task ID</th><th>Exception Trigger</th><th>Exception Path</th><th>Documented?</th></tr></thead>
    <tbody>
      ${data.taskRegister.map(t => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(t.taskId)}</td>
        <td style="font-size:11px">${esc(t.exceptionTrigger) || '—'}</td>
        <td style="font-size:11px">${esc(t.exceptionPath) || '—'}</td>
        <td style="text-align:center">${t.exceptionPath ? 'Yes' : 'No'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- §18 Capacity Assumptions -->
<div class="section">
  ${sectionHeader('18', 'Capacity Assumptions')}
  <table>
    <thead><tr><th>Task / Module</th><th>OLA</th><th>Capacity Baseline</th><th>Behaviour Above Baseline</th></tr></thead>
    <tbody>
      ${data.taskRegister.map(t => `
      <tr>
        <td><span style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(t.taskId)}</span> ${esc(t.name)}</td>
        <td style="font-family:monospace">${esc(t.olaCompact)}</td>
        <td style="font-size:11px">${esc(t.capacityAssumption) || '—'}</td>
        <td style="font-size:11px">${esc(t.behaviourAboveBaseline) || '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

${data.severityTierReconciliation && data.severityTierReconciliation.length > 0 ? `
<!-- §19 Severity-Tier Reconciliation -->
<div class="section">
  ${sectionHeader('19', 'Severity-Tier Reconciliation')}
  <table>
    <thead><tr><th>Variant / Tier</th><th>Stated SLA</th><th>Computed SLA (sum of OLAs)</th><th>Variance</th><th>Justification</th></tr></thead>
    <tbody>
      ${data.severityTierReconciliation.map(tier => `
      <tr>
        <td><strong>${esc(tier.tier)}</strong></td>
        <td style="font-family:monospace">${esc(tier.statedSlaDays)}d</td>
        <td style="font-family:monospace">${esc(tier.computedSlaDays)}d</td>
        <td style="font-family:monospace;font-weight:700;color:${tier.variance === 0 ? 'var(--s0)' : 'var(--s2)'}">${tier.variance >= 0 ? '+' : ''}${esc(tier.variance)}d</td>
        <td style="font-size:11px">${esc(tier.varianceJustification) || (tier.variance === 0 ? 'Aligned' : '—')}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>` : ''}

<!-- §20 Workflow Diagram (BPMN) -->
<div class="section page-break">
  ${sectionHeader('20', 'Workflow Diagram')}
  <table style="margin-bottom:20px">
    <thead><tr><th>Field</th><th>Value</th></tr></thead>
    <tbody>
      <tr><td>BPMN Process ID</td><td style="font-family:monospace">${esc(data.workflowDiagram.id)}</td></tr>
      <tr>
        <td>Lane Order (Actual)</td>
        <td>${data.workflowDiagram.participants && data.workflowDiagram.participants.length > 0
          ? data.workflowDiagram.participants.map(p => esc(p.name)).join(' → ')
          : '<span style="color:#c62828;font-weight:600">⚠ No participants defined</span>'}</td>
      </tr>
      <tr>
        <td>Lane Order (Expected)</td>
        <td style="color:var(--muted);font-size:11px">${esc(getExpectedLaneOrder(archetype))}</td>
      </tr>
      <tr><td>Diagram Width (columns)</td><td style="${colCss}">${colCount} columns <span style="font-weight:400;color:var(--muted)">(target ≤${colLimit})</span></td></tr>
      <tr><td>Diagram Quality Checklist</td><td style="${summaryCss}">${passCount} PASS · ${failCount > 0 ? failCount + ' FAIL · ' : ''}${advisoryCount > 0 ? advisoryCount + ' Advisory · ' : ''}${naCount} N/A</td></tr>
      <tr><td>BPMN Viewer</td><td>bpmn.io / bpmn-navigated-viewer@18.16.0</td></tr>
    </tbody>
  </table>

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:0 0 8px">Pre-Import Validation Checklist (Diagram_Quality_Checklist_v1.1)</div>
  <table style="margin-bottom:20px">
    <thead><tr><th style="width:40px">#</th><th>Rule</th><th style="width:110px">Status</th><th>Detail</th></tr></thead>
    <tbody>
      ${standardResults.map(r => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--muted);text-align:center">${r.rule}</td>
        <td style="font-size:11px">${esc(r.name)}</td>
        <td style="text-align:center">${qualityStatusBadge(r)}</td>
        <td style="font-size:11px;color:${r.status === 'fail' ? '#c62828' : r.status === 'advisory' ? '#e65100' : 'inherit'}">${esc(r.detail)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  ${skeletonResults.length > 0 ? `
  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#6A1B9A;margin:0 0 8px">Capability Service Skeleton Compliance (Capability_Service_Skeleton_v1.0)</div>
  <table style="margin-bottom:20px">
    <thead><tr><th style="width:60px">Check</th><th>Description</th><th style="width:110px">Status</th><th>Detail</th></tr></thead>
    <tbody>
      ${skeletonResults.map(r => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:#6A1B9A;text-align:center">${esc(r.name.split(' ')[0])}</td>
        <td style="font-size:11px">${esc(r.name.replace(/^SK-\d+ /, ''))}</td>
        <td style="text-align:center">${qualityStatusBadge(r)}</td>
        <td style="font-size:11px;color:${r.status === 'fail' ? '#c62828' : r.status === 'advisory' ? '#e65100' : 'inherit'}">${esc(r.detail)}</td>
      </tr>`).join('')}
    </tbody>
  </table>` : ''}
  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:20px 0 8px">§20 Register Coverage — Task Register → Diagram</div>
  <table style="margin-bottom:20px">
    <thead><tr><th>Task ID</th><th>Task Name</th><th>Module</th><th>Digitization</th><th>In Diagram</th></tr></thead>
    <tbody>
      ${data.taskRegister.map(t => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(t.taskId)}</td>
        <td>${esc(t.name)}</td>
        <td style="font-family:monospace">${esc(t.moduleId)}</td>
        <td>${digitizationBadge(t.digitizationMode)}</td>
        <td style="text-align:center">${diagramTaskIds.has(t.taskId) ? '<span class="badge pass">✓ Yes</span>' : '<span class="badge mat-deprecated">— No</span>'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  ${hasVariants ? `
  <div class="variant-tabs">
    ${escapedVariants.map((v, i) => `<button class="tab-btn${i === 0 ? ' active' : ''}" onclick="showVariant(${i})">${esc(v.tier)}</button>`).join('')}
    <button class="tab-btn" onclick="showVariant(${escapedVariants.length})">Legend</button>
  </div>
  ${escapedVariants.map((v, i) => `
  <div id="panel-v${i}" class="variant-panel${i === 0 ? '' : ' hidden'}">
    <div style="padding:8px 0 6px;font-style:italic;font-size:12px;color:var(--muted)">Variant: <strong>${esc(v.tier)}</strong> — complete flow</div>
    <div class="bpmn-wrap"><div id="diagram-v${i}"></div></div>
    <div class="bpmn-btns">
      <button class="bpmn-btn" onclick="printVariant(${i})">↓ BPMN PDF</button>
      <button class="bpmn-btn outline" onclick="downloadVariantSvg(${i}, '${esc(v.tier)}')">↓ SVG</button>
      <button class="bpmn-btn outline" onclick="downloadVariantXml(${i}, '${esc(v.tier)}')">↓ BPMN XML</button>
    </div>
  </div>`).join('')}
  <div id="panel-v${escapedVariants.length}" class="variant-panel hidden">
    <div style="font-weight:600;font-size:13px;margin:12px 0 8px">Variant Comparison — Severity Tier Summary</div>
    ${data.severityTierReconciliation && data.severityTierReconciliation.length > 0 ? `
    <table>
      <thead><tr><th>Tier</th><th>Stated SLA</th><th>Computed SLA</th><th>Variance</th><th>Justification</th></tr></thead>
      <tbody>
        ${data.severityTierReconciliation.map(t => `
        <tr>
          <td><strong>${esc(t.tier)}</strong></td>
          <td style="font-family:monospace">${esc(t.statedSlaDays)}d</td>
          <td style="font-family:monospace">${esc(t.computedSlaDays)}d</td>
          <td style="font-family:monospace;font-weight:700;color:${t.variance === 0 ? 'var(--s0)' : 'var(--s2)'}">${t.variance >= 0 ? '+' : ''}${esc(t.variance)}d</td>
          <td style="font-size:11px">${esc(t.varianceJustification) || (t.variance === 0 ? 'Aligned' : '—')}</td>
        </tr>`).join('')}
      </tbody>
    </table>` : '<p style="color:var(--muted);font-size:12px">No severity tier reconciliation data available.</p>'}
    <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:20px 0 8px">BPMN Color Legend</div>
    <table><thead><tr><th>Color</th><th>Key</th><th>Used For</th></tr></thead><tbody>
      <tr><td><span style="display:inline-block;width:18px;height:14px;background:#E8F5E9;border:1.5px solid #2E7D32;vertical-align:middle"></span></td><td>happy</td><td>Start events, happy path</td></tr>
      <tr><td><span style="display:inline-block;width:18px;height:14px;background:#C8E6C9;border:1.5px solid #1B5E20;vertical-align:middle"></span></td><td>happy_end</td><td>Success end events</td></tr>
      <tr><td><span style="display:inline-block;width:18px;height:14px;background:#FFE0B2;border:1.5px solid #E65100;vertical-align:middle"></span></td><td>error</td><td>Exceptions / warnings</td></tr>
      <tr><td><span style="display:inline-block;width:18px;height:14px;background:#FFCDD2;border:1.5px solid #C62828;vertical-align:middle"></span></td><td>cancel</td><td>Cancellation / error end</td></tr>
      <tr><td><span style="display:inline-block;width:18px;height:14px;background:#E0F7FA;border:1.5px solid #00838F;vertical-align:middle"></span></td><td>system</td><td>Automated service tasks</td></tr>
      <tr><td><span style="display:inline-block;width:18px;height:14px;background:#F3E5F5;border:1.5px solid #6A1B9A;vertical-align:middle"></span></td><td>manual</td><td>Human / user tasks</td></tr>
      <tr><td><span style="display:inline-block;width:18px;height:14px;background:#E3F2FD;border:1.5px solid #1565C0;vertical-align:middle"></span></td><td>decision</td><td>Gateways / decisions</td></tr>
    </tbody></table>
  </div>` : `
  <div class="bpmn-wrap">
    <div id="diagram-s2"></div>
  </div>
  <div class="bpmn-btns">
    <button class="bpmn-btn" id="btn-pdf-bpmn" onclick="printBpmn()">↓ BPMN PDF</button>
    <button class="bpmn-btn outline" id="btn-svg" onclick="downloadSvg()">↓ SVG</button>
    <button class="bpmn-btn outline" id="btn-xml" onclick="downloadXml()">↓ BPMN XML</button>
    ${workflowCsv ? `<button class="bpmn-btn outline" id="btn-csv" onclick="downloadCsv()">↓ Workflow CSV</button>` : ''}
  </div>`}
</div>

<!-- §21 Subflow Alignment Summary -->
<div class="section">
  ${sectionHeader('21', 'Subflow Alignment Summary')}
  <table>
    <thead><tr><th>Module ID</th><th>Aligned Pattern</th><th>Pattern Maturity</th><th>WCP Codes</th><th>Deviation Notes</th></tr></thead>
    <tbody>
      ${data.subflowAlignment.map(s => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(s.moduleId)}</td>
        <td>${esc(s.pattern)}</td>
        <td>${s.patternMaturity ? maturityBadge(s.patternMaturity) : '—'}</td>
        <td style="font-family:monospace">${esc(s.wcpCode)}</td>
        <td>${esc(s.deviation) || '<span style="color:var(--muted)">None</span>'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

${data.patternDriftNotes && data.patternDriftNotes.length > 0 ? `
<!-- §22 Pattern Drift Notes -->
<div class="section">
  ${sectionHeader('22', 'Pattern Drift Notes')}
  <table>
    <thead><tr><th>Module</th><th>Standard Pattern</th><th>Deviation</th><th>Justification</th><th>Library Update Proposed?</th></tr></thead>
    <tbody>
      ${data.patternDriftNotes.map(n => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(n.moduleId)}</td>
        <td>${esc(n.standardPattern)}</td>
        <td style="font-size:11px">${esc(n.deviation)}</td>
        <td style="font-size:11px">${esc(n.justification)}</td>
        <td style="text-align:center">${n.libraryUpdateRecommended ? '<span class="badge pass">Yes</span>' : '<span class="badge mat-deprecated">No</span>'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>` : ''}

<div class="toolbar">
  <button class="btn" onclick="window.print()">↓ Export Stage 2 PDF</button>
</div>

<script src="https://unpkg.com/bpmn-js@18.16.0/dist/bpmn-navigated-viewer.production.min.js"></script>
<script>
${hasVariants ? `
// ── Multi-variant mode ─────────────────────────────────────────────────────────
const variantXmls = [${escapedVariants.map(v => `\`${v.xml}\``).join(',')}];
const variantViewers = new Array(variantXmls.length).fill(null);

async function initVariantViewer(i) {
  if (variantViewers[i]) return;
  variantViewers[i] = new BpmnJS({ container: '#diagram-v' + i });
  try {
    await variantViewers[i].importXML(variantXmls[i]);
    variantViewers[i].get('canvas').zoom('fit-viewport', 'auto');
  } catch(e) {
    document.getElementById('diagram-v' + i).innerHTML =
      '<div style="padding:24px;color:#c62828;font-family:monospace">BPMN error: ' + e.message + '</div>';
  }
}

initVariantViewer(0);

function showVariant(i) {
  document.querySelectorAll('.variant-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-v' + i).classList.remove('hidden');
  document.querySelectorAll('.tab-btn')[i].classList.add('active');
  if (i < variantXmls.length) initVariantViewer(i);
}

async function downloadVariantSvg(i, tier) {
  try {
    const { svg } = await variantViewers[i].saveSVG();
    const a = document.createElement('a');
    a.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    a.download = '${esc(serviceCode)}-' + tier.toLowerCase() + '-workflow.svg';
    a.click();
  } catch(e) { alert('SVG export failed: ' + e.message); }
}

function downloadVariantXml(i, tier) {
  const a = document.createElement('a');
  a.href = 'data:application/xml;charset=utf-8,' + encodeURIComponent(variantXmls[i]);
  a.download = '${esc(serviceCode)}-' + tier.toLowerCase() + '-workflow.bpmn';
  a.click();
}

function printVariant(i) {
  variantViewers[i].saveSVG().then(({svg}) => {
    const w = window.open('');
    w.document.write('<html><head><title>BPMN</title><style>body{margin:0}svg{width:100%;height:auto}</style></head><body>' + svg + '</body></html>');
    w.document.close();
    w.onload = () => { w.print(); };
  });
}
` : `
// ── Single-diagram mode ────────────────────────────────────────────────────────
const xml = \`${escaped}\`;
let viewer;

(async () => {
  viewer = new BpmnJS({ container: '#diagram-s2' });
  try {
    await viewer.importXML(xml);
    viewer.get('canvas').zoom('fit-viewport', 'auto');
  } catch(e) {
    document.getElementById('diagram-s2').innerHTML =
      '<div style="padding:24px;color:#c62828;font-family:monospace">BPMN load error: ' + e.message + '</div>';
  }
})();

async function downloadSvg() {
  try {
    const { svg } = await viewer.saveSVG();
    const a = document.createElement('a');
    a.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    a.download = '${esc(serviceCode)}-workflow.svg';
    a.click();
  } catch(e) { alert('SVG export failed: ' + e.message); }
}

function downloadXml() {
  const a = document.createElement('a');
  a.href = 'data:application/xml;charset=utf-8,' + encodeURIComponent(xml);
  a.download = '${esc(serviceCode)}-workflow.bpmn';
  a.click();
}

function printBpmn() {
  viewer.saveSVG().then(({svg}) => {
    const w = window.open('');
    w.document.write('<html><head><title>BPMN</title><style>body{margin:0}svg{width:100%;height:auto}</style></head><body>' + svg + '</body></html>');
    w.document.close();
    w.onload = () => { w.print(); };
  });
}
${workflowCsv ? `
const csvData = \`${escapedCsv}\`;
function downloadCsv() {
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
  a.download = '${esc(serviceCode)}-workflow.csv';
  a.click();
}` : ''}
`}
</script>
</body>
</html>`;
}

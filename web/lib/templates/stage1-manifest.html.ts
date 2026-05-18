import type { Stage1 } from '../schemas/manifest.schema';
import { esc, MANIFEST_CSS, docHeader, sectionHeader } from './manifest-shared';

function archetypeBadge(a: string): string {
  const cls = a === 'Capability' ? 'arch-cap' : a === 'Composite' ? 'arch-comp' : 'arch-orch';
  return `<span class="badge ${cls}" style="font-size:13px;padding:5px 14px">${esc(a)}</span>`;
}

export function stage1ManifestTemplate(data: Stage1, serviceCode: string): string {
  const dd = data.decompositionDecision;
  const sb = data.serviceBoundary;
  const ot = data.outcomeTargets;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(serviceCode)} — Stage 1 Service Design</title>
${MANIFEST_CSS}
</head>
<body>

${docHeader({
  serviceCode,
  title: 'Service Design',
  subtitle: 'Decomposition, Boundary & Outcome Targets',
  stageBadge: 'Stage 1 — Service Design',
  stageClass: 's1',
  sections: '§8–13',
})}

<!-- §8 Decomposition Decision -->
<div class="section">
  ${sectionHeader('8', 'Decomposition Decision')}

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§8.1 Archetype Declaration</div>
  <table style="margin-bottom:20px">
    <thead><tr><th>Field</th><th>Value</th></tr></thead>
    <tbody>
      <tr><td>Declared Archetype</td><td>${archetypeBadge(dd.archetype)}</td></tr>
      <tr><td>Decision Date</td><td>${esc(dd.decisionDate) || '—'}</td></tr>
      <tr><td>Decision Made By</td><td>${esc(dd.decisionMadeBy) || '—'}</td></tr>
      <tr><td>Rationale (1 paragraph)</td><td>${esc(dd.rationale)}</td></tr>
    </tbody>
  </table>

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§8.2 Boundary Smell Tests</div>
  <table>
    <thead><tr><th>Smell Test</th><th>Pass/Fail/N-A</th><th>Notes</th></tr></thead>
    <tbody>
      ${dd.smellTests.map(t => `
      <tr>
        <td>${esc(t.test)}</td>
        <td><span class="badge ${t.result}">${esc(t.result.toUpperCase())}</span></td>
        <td>${esc(t.notes)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  ${dd.calledServices.length > 0 ? `
  <div style="margin-top:12px">
    <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px">Called Services</div>
    <div class="tag-list">${dd.calledServices.map(s => `<span class="tag">${esc(s)}</span>`).join('')}</div>
  </div>` : ''}

  <div style="margin-top:16px">
    <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§8.3 Decomposition Decision Log Entry</div>
    <table>
      <thead><tr><th>Decision</th><th>Date</th><th>Made By</th><th>Rationale</th><th>Reviewed By</th></tr></thead>
      <tbody>
        ${dd.decisionLog.map(l => `<tr><td>${esc(l.decision)}</td><td>${esc(l.date)}</td><td>${esc(l.madeBy) || '—'}</td><td>${esc(l.rationale) || '—'}</td><td>${esc(l.reviewer)}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>

<!-- §9 Service Boundary & Interfaces -->
<div class="section">
  ${sectionHeader('9', 'Service Boundary & Interfaces')}

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§9.1 Inputs Crossing the Boundary In</div>
  <table style="margin-bottom:16px">
    <thead><tr><th>Input</th><th>From</th><th>Format</th><th>Frequency</th><th>Validation</th></tr></thead>
    <tbody>${sb.inputs.map(i => `<tr><td>${esc(i.name)}</td><td>${esc(i.from) || esc(i.source) || '—'}</td><td>${esc(i.format)}</td><td>${esc(i.frequency) || '—'}</td><td>${esc(i.validation) || '—'}</td></tr>`).join('')}</tbody>
  </table>

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§9.2 Outputs Crossing the Boundary Out</div>
  <table style="margin-bottom:16px">
    <thead><tr><th>Output</th><th>To</th><th>Format</th><th>Trigger</th><th>Evidence</th></tr></thead>
    <tbody>${sb.outputs.map(o => `<tr><td>${esc(o.name)}</td><td>${esc(o.to) || esc(o.destination) || '—'}</td><td>${esc(o.format)}</td><td>${esc(o.trigger) || '—'}</td><td>${esc(o.evidence) || '—'}</td></tr>`).join('')}</tbody>
  </table>

  ${sb.calledServices.length > 0 ? `
  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§9.3 Called Services [CONDITIONAL: Composite/Orchestrator only]</div>
  <table>
    <thead><tr><th>Called Service ID</th><th>Called Service Name</th><th>Mode (Sync/Async)</th><th>Caller-Side OLA</th><th>Cascade Pattern</th></tr></thead>
    <tbody>
      ${sb.calledServices.map(s => `
      <tr>
        <td style="font-family:monospace">${esc(s.serviceId) || '—'}</td>
        <td>${esc(s.serviceName) || esc(s.service)}</td>
        <td>${esc(s.mode) || '—'}</td>
        <td style="font-family:monospace">${esc(s.ola)}</td>
        <td><span class="badge ${s.cascadePattern === 'Sequential' ? 'mat-candidate' : s.cascadePattern === 'Parallel' ? 'pass' : 'assisted'}">${esc(s.cascadePattern)}</span></td>
      </tr>`).join('')}
    </tbody>
  </table>` : ''}
</div>

<!-- §10 Value Stream & Customer Journey -->
<div class="section">
  ${sectionHeader('10', 'Value Stream & Customer Journey')}
  <table>
    <thead><tr><th>Stage</th><th>Customer-visible Activity</th><th>Service-side Activity</th><th>Stage Outcome</th><th>Stage Time Target</th></tr></thead>
    <tbody>
      ${data.valueStream.map(v => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--navy)">${v.phase}. ${esc(v.name)}</td>
        <td>${esc(v.customerActivity)}</td>
        <td>${esc(v.serviceActivity)}</td>
        <td>${esc(v.stageOutcome) || '—'}</td>
        <td>${esc(v.stageTimeTarget) || '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- §11 Experience & Outcome Targets -->
<div class="section">
  ${sectionHeader('11', 'Experience & Outcome Targets')}

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§11.1 Service-Level SLA Targets</div>
  ${ot.slaTargets && ot.slaTargets.length > 0 ? `
  <table style="margin-bottom:20px">
    <thead><tr><th>SLA Tier (if any)</th><th>Cycle Time Target</th><th>Quality Target</th><th>Availability Target</th></tr></thead>
    <tbody>${ot.slaTargets.map(t => `<tr><td>${esc(t.tier)}</td><td>${esc(t.cycleTimeTarget)}</td><td>${esc(t.qualityTarget) || '—'}</td><td>${esc(t.availabilityTarget) || '—'}</td></tr>`).join('')}</tbody>
  </table>` : `
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px">
    <div class="info-box" style="text-align:center">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:4px">Stated SLA</div>
      <div style="font-size:28px;font-weight:700;color:var(--navy)">${esc(ot.statedSlaDays)}<span style="font-size:14px;font-weight:400"> days</span></div>
    </div>
    <div class="info-box" style="text-align:center">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:4px">Computed SLA</div>
      <div style="font-size:28px;font-weight:700;color:var(--navy)">${esc(ot.computedSlaDays)}<span style="font-size:14px;font-weight:400"> days</span></div>
    </div>
    <div class="info-box" style="text-align:center;border-left-color:${ot.variance === 0 ? 'var(--s0)' : 'var(--s2)'}">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:4px">Variance</div>
      <div style="font-size:28px;font-weight:700;color:${ot.variance === 0 ? 'var(--s0)' : 'var(--s2)'}">${ot.variance >= 0 ? '+' : ''}${esc(ot.variance)}<span style="font-size:14px;font-weight:400"> days</span></div>
    </div>
  </div>`}

  ${ot.varianceJustification ? `<div class="info-box" style="margin-bottom:16px"><strong>Variance Justification:</strong> ${esc(ot.varianceJustification)}</div>` : ''}

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§11.2 SLA Cascade Reconciliation [CONDITIONAL: Composite/Orchestrator]</div>
  <table>
    <thead><tr><th>Component</th><th>OLA</th><th>Execution Mode (Parallel/Sequential)</th><th>Contribution to SLA</th></tr></thead>
    <tbody>
      ${ot.olaBreakdown.map(o => `
      <tr>
        <td>${esc(o.service)}</td>
        <td style="font-family:monospace;font-weight:600">${esc(o.olaDays)}</td>
        <td><span class="badge ${o.executionMode === 'Parallel' ? 'pass' : 'mat-candidate'}">${esc(o.executionMode)}</span></td>
        <td>${esc(o.contributionToSla) || '—'}</td>
      </tr>`).join('')}
      <tr style="font-weight:600;background:var(--paper-2)"><td>Computed SLA</td><td style="font-family:monospace">—</td><td>—</td><td style="font-family:monospace">≈${esc(ot.computedSlaDays)}d</td></tr>
      <tr style="font-weight:600;background:var(--paper-2)"><td>Stated SLA</td><td style="font-family:monospace">—</td><td>—</td><td style="font-family:monospace">${esc(ot.statedSlaDays)}d</td></tr>
      <tr style="font-weight:700;background:var(--paper-2);color:${ot.variance === 0 ? 'var(--s0)' : 'var(--s2)'}"><td>Variance</td><td style="font-family:monospace">—</td><td>—</td><td>${ot.variance >= 0 ? '+' : ''}${esc(ot.variance)}d${ot.variance !== 0 ? ' (justification required)' : ''}</td></tr>
    </tbody>
  </table>
</div>

<!-- §12 Audit & Regulatory Drivers -->
<div class="section">
  ${sectionHeader('12', 'Audit & Regulatory Drivers')}
  <table>
    <thead><tr><th>Control / Step</th><th>Regulatory Driver</th><th>Evidence Required</th><th>Retention</th></tr></thead>
    <tbody>
      ${data.auditDrivers.map(a => `
      <tr>
        <td>${esc(a.controlStep)}</td>
        <td>${esc(a.regulation)}</td>
        <td>${esc(a.evidenceRequired)}</td>
        <td style="font-family:monospace">${a.retentionDays ? a.retentionDays + ' days' : '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- §13 Service Lifecycle Stage -->
<div class="section">
  ${sectionHeader('13', 'Service Lifecycle Stage')}
  <table>
    <thead><tr><th>Field</th><th>Value</th></tr></thead>
    <tbody>
      <tr><td>Current Stage</td><td><span class="badge ${data.lifecycleStage.stage === 'Operating' || data.lifecycleStage.stage === 'Optimizing' ? 'pass' : data.lifecycleStage.stage === 'Designing' ? 'mat-candidate' : data.lifecycleStage.stage === 'Deprecating' ? 'risk-risk' : 'assisted'}">${esc(data.lifecycleStage.stage)}</span></td></tr>
      <tr><td>Target Go-Live</td><td>${esc(data.lifecycleStage.targetGoLive) || '—'}</td></tr>
      <tr><td>Stable Operation Date</td><td>${esc(data.lifecycleStage.stableOperationDate) || '—'}</td></tr>
      <tr><td>Deprecation Plan</td><td>${esc(data.lifecycleStage.deprecationPlan) || 'N/A'}</td></tr>
      <tr><td>Annual Review Date</td><td>${esc(data.lifecycleStage.annualReviewDate)}</td></tr>
    </tbody>
  </table>
</div>

<div class="toolbar">
  <button class="btn" onclick="window.print()">↓ Export Stage 1 PDF</button>
</div>

</body>
</html>`;
}

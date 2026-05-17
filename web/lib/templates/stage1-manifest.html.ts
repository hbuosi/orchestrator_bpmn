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
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
    <div>Archetype:</div>
    ${archetypeBadge(dd.archetype)}
  </div>

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§8.2 Boundary Smell Tests</div>
  <table>
    <thead><tr><th>Test</th><th>Result</th><th>Notes</th></tr></thead>
    <tbody>
      ${dd.smellTests.map(t => `
      <tr>
        <td>${esc(t.test)}</td>
        <td><span class="badge ${t.result}">${esc(t.result.toUpperCase())}</span></td>
        <td>${esc(t.notes)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div style="margin-top:16px">
    <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px">§8.1 Rationale</div>
    <div class="info-box">${esc(dd.rationale)}</div>
  </div>

  ${dd.calledServices.length > 0 ? `
  <div style="margin-top:12px">
    <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px">Called Services</div>
    <div class="tag-list">${dd.calledServices.map(s => `<span class="tag">${esc(s)}</span>`).join('')}</div>
  </div>` : ''}

  <div style="margin-top:16px">
    <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§8.3 Decision Log</div>
    <table>
      <thead><tr><th>Date</th><th>Decision</th><th>Reviewer</th></tr></thead>
      <tbody>
        ${dd.decisionLog.map(l => `<tr><td>${esc(l.date)}</td><td>${esc(l.decision)}</td><td>${esc(l.reviewer)}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>

<!-- §9 Service Boundary & Interfaces -->
<div class="section">
  ${sectionHeader('9', 'Service Boundary & Interfaces')}

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
    <div>
      <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">Inputs</div>
      <table>
        <thead><tr><th>Name</th><th>Format</th><th>Source</th></tr></thead>
        <tbody>${sb.inputs.map(i => `<tr><td>${esc(i.name)}</td><td>${esc(i.format)}</td><td>${esc(i.source)}</td></tr>`).join('')}</tbody>
      </table>
    </div>
    <div>
      <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">Outputs</div>
      <table>
        <thead><tr><th>Name</th><th>Format</th><th>Destination</th></tr></thead>
        <tbody>${sb.outputs.map(o => `<tr><td>${esc(o.name)}</td><td>${esc(o.format)}</td><td>${esc(o.destination)}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  </div>

  ${sb.calledServices.length > 0 ? `
  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§9.3 Called Services (Composite/Orchestrating)</div>
  <table>
    <thead><tr><th>Service</th><th>Cascade Pattern</th><th>OLA</th></tr></thead>
    <tbody>
      ${sb.calledServices.map(s => `
      <tr>
        <td>${esc(s.service)}</td>
        <td><span class="badge ${s.cascadePattern === 'Sequential' ? 'mat-candidate' : s.cascadePattern === 'Parallel' ? 'pass' : 'assisted'}">${esc(s.cascadePattern)}</span></td>
        <td><code>${esc(s.ola)}</code></td>
      </tr>`).join('')}
    </tbody>
  </table>` : ''}
</div>

<!-- §10 Value Stream & Customer Journey -->
<div class="section">
  ${sectionHeader('10', 'Value Stream & Customer Journey')}
  <table>
    <thead><tr><th>#</th><th>Phase</th><th>Customer Activity</th><th>Service Activity</th></tr></thead>
    <tbody>
      ${data.valueStream.map(v => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--navy)">${v.phase}</td>
        <td><strong>${esc(v.name)}</strong></td>
        <td>${esc(v.customerActivity)}</td>
        <td>${esc(v.serviceActivity)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- §11 Experience & Outcome Targets -->
<div class="section">
  ${sectionHeader('11', 'Experience & Outcome Targets')}

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
  </div>

  ${ot.varianceJustification ? `<div class="info-box" style="margin-bottom:16px"><strong>Variance Justification:</strong> ${esc(ot.varianceJustification)}</div>` : ''}

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§11.2 SLA Cascade Arithmetic</div>
  <table>
    <thead><tr><th>Service / Component</th><th>OLA (days)</th><th>Execution Mode</th></tr></thead>
    <tbody>
      ${ot.olaBreakdown.map(o => `
      <tr>
        <td>${esc(o.service)}</td>
        <td style="font-family:monospace;font-weight:600">${esc(o.olaDays)}</td>
        <td><span class="badge ${o.executionMode === 'Parallel' ? 'pass' : 'mat-candidate'}">${esc(o.executionMode)}</span></td>
      </tr>`).join('')}
      <tr style="font-weight:700;background:var(--paper-2)">
        <td>Total (computed)</td>
        <td style="font-family:monospace">${esc(ot.computedSlaDays)}</td>
        <td>—</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- §12 Audit & Regulatory Drivers -->
<div class="section">
  ${sectionHeader('12', 'Audit & Regulatory Drivers')}
  <table>
    <thead><tr><th>Control Step</th><th>Regulation / Policy</th><th>Evidence Required</th><th>Retention (days)</th></tr></thead>
    <tbody>
      ${data.auditDrivers.map(a => `
      <tr>
        <td>${esc(a.controlStep)}</td>
        <td>${esc(a.regulation)}</td>
        <td>${esc(a.evidenceRequired)}</td>
        <td style="font-family:monospace;text-align:center">${esc(a.retentionDays)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- §13 Service Lifecycle Stage -->
<div class="section">
  ${sectionHeader('13', 'Service Lifecycle Stage')}
  <div class="kv-grid">
    <div class="k">Current Stage</div>
    <div class="v"><span class="badge ${data.lifecycleStage.stage === 'Operating' ? 'pass' : data.lifecycleStage.stage === 'Designing' ? 'mat-candidate' : 'assisted'}">${esc(data.lifecycleStage.stage)}</span></div>
    <div class="k">Annual Review Date</div>
    <div class="v">${esc(data.lifecycleStage.annualReviewDate)}</div>
  </div>
</div>

<div class="toolbar">
  <button class="btn" onclick="window.print()">↓ Export Stage 1 PDF</button>
</div>

</body>
</html>`;
}

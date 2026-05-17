import type { Stage3 } from '../schemas/manifest.schema';
import { esc, MANIFEST_CSS, docHeader, sectionHeader, riskBadge } from './manifest-shared';

export function stage3ManifestTemplate(data: Stage3, serviceCode: string): string {
  const bh = data.buildHandoff;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(serviceCode)} — Stage 3 Build-Ready Requirements</title>
${MANIFEST_CSS}
</head>
<body>

${docHeader({
  serviceCode,
  title: 'Build-Ready Requirements',
  subtitle: 'Data Contracts, KPIs, Operating Model & Acceptance Criteria',
  stageBadge: 'Stage 3 — Build-Ready Requirements',
  stageClass: 's3',
  sections: '§23–27',
})}

<!-- §23 Build-Ready Handoff -->
<div class="section">
  ${sectionHeader('23', 'Build-Ready Handoff')}

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§23.1 Data Contracts</div>
  ${bh.dataContracts.map(dc => `
  <div style="margin-bottom:16px;padding:16px;border:1px solid var(--rule);border-radius:4px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <strong>${esc(dc.name)}</strong>
      <span class="badge ${dc.direction === 'Inbound' ? 'pass' : 'manual'}">${esc(dc.direction)}</span>
    </div>
    <div class="kv-grid">
      <div class="k">Schema</div><div class="v" style="font-family:monospace;font-size:12px;white-space:pre-wrap">${esc(dc.schemaDescription)}</div>
      <div class="k">Mandatory</div><div class="v"><div class="tag-list">${dc.mandatoryFields.map(f => `<span class="tag">${esc(f)}</span>`).join('')}</div></div>
      <div class="k">Optional</div><div class="v"><div class="tag-list">${dc.optionalFields.map(f => `<span class="tag" style="opacity:.7">${esc(f)}</span>`).join('')}</div></div>
      <div class="k">Versioning</div><div class="v">${esc(dc.versioningStrategy)}</div>
    </div>
  </div>`).join('')}

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:20px 0 8px">§23.2 Integration Points</div>
  <table>
    <thead><tr><th>External System</th><th>Direction</th><th>Protocol</th><th>Frequency</th><th>Auth</th><th>Fallback</th></tr></thead>
    <tbody>
      ${bh.integrationPoints.map(ip => `
      <tr>
        <td><strong>${esc(ip.system)}</strong></td>
        <td><span class="badge ${ip.direction === 'Inbound' ? 'pass' : ip.direction === 'Outbound' ? 'manual' : 'assisted'}">${esc(ip.direction)}</span></td>
        <td style="font-family:monospace">${esc(ip.protocol)}</td>
        <td>${esc(ip.frequency)}</td>
        <td style="font-family:monospace;font-size:11px">${esc(ip.authentication)}</td>
        <td style="font-size:11px">${esc(ip.fallbackBehavior)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:20px 0 8px">§23.3 Automation Candidates (Confirmed)</div>
  <table>
    <thead><tr><th>Task ID</th><th>Automation Mode</th><th>Build Approach</th><th>Prerequisites</th><th>Phase</th></tr></thead>
    <tbody>
      ${bh.automationCandidates.map(ac => `
      <tr>
        <td style="font-family:monospace;font-weight:600">${esc(ac.taskId)}</td>
        <td>${esc(ac.automationMode)}</td>
        <td>${esc(ac.buildApproach)}</td>
        <td><ul style="margin:0;padding-left:14px">${ac.prerequisites.map(p => `<li style="font-size:11px">${esc(p)}</li>`).join('')}</ul></td>
        <td><span class="badge ${ac.phase === 'Phase 1' ? 'pass' : 'mat-candidate'}">${esc(ac.phase)}</span></td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- §24 KPI Inheritance -->
<div class="section">
  ${sectionHeader('24', 'KPI Inheritance')}
  <table>
    <thead><tr><th>KPI Name</th><th>Definition</th><th>Source Tasks</th><th>Parent KPI</th><th>Child KPI</th><th>Frequency</th><th>Target</th></tr></thead>
    <tbody>
      ${data.kpiInheritance.map(k => `
      <tr>
        <td><strong>${esc(k.name)}</strong><br><span style="font-size:11px;color:var(--muted)">Baseline: ${esc(k.baseline)}</span></td>
        <td style="font-size:11px">${esc(k.definition)}</td>
        <td><div class="tag-list">${k.sourceTasks.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></td>
        <td style="font-size:11px">${esc(k.parentKpi)}</td>
        <td style="font-size:11px">${esc(k.childKpi)}</td>
        <td><span class="badge mat-candidate">${esc(k.frequency)}</span></td>
        <td style="font-weight:600;color:var(--navy)">${esc(k.target)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- §25 Operating Model -->
<div class="section page-break">
  ${sectionHeader('25', 'Operating Model')}

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§25.1 RACI</div>
  <table>
    <thead><tr><th>Activity</th><th>Responsible (R)</th><th>Accountable (A)</th><th>Consulted (C)</th><th>Informed (I)</th></tr></thead>
    <tbody>
      ${data.operatingModel.raci.map(r => `
      <tr>
        <td><strong>${esc(r.activity)}</strong></td>
        <td>${esc(r.responsible)}</td>
        <td>${esc(r.accountable)}</td>
        <td>${esc(r.consulted)}</td>
        <td>${esc(r.informed)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:20px 0 8px">§25.2 Governance Cadence</div>
  <table>
    <thead><tr><th>Forum</th><th>Frequency</th><th>Attendees</th><th>Purpose</th></tr></thead>
    <tbody>
      ${data.operatingModel.cadence.map(c => `
      <tr>
        <td><strong>${esc(c.forum)}</strong></td>
        <td><span class="badge mat-candidate">${esc(c.frequency)}</span></td>
        <td>${esc(c.attendees)}</td>
        <td>${esc(c.purpose)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- §26 Acceptance Criteria & Test Approach -->
<div class="section">
  ${sectionHeader('26', 'Acceptance Criteria & Test Approach')}
  <table>
    <thead><tr><th>#</th><th>Criterion</th><th>Test Approach</th><th>Pass Threshold</th><th>Test Owner</th></tr></thead>
    <tbody>
      ${data.acceptanceCriteria.map((ac, i) => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--navy);text-align:center">${i + 1}</td>
        <td>${esc(ac.criterion)}</td>
        <td>${esc(ac.testApproach)}</td>
        <td style="font-weight:600;color:var(--s0)">${esc(ac.passThreshold)}</td>
        <td>${esc(ac.testOwner)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- §27 Risks & Open Questions -->
<div class="section">
  ${sectionHeader('27', 'Risks & Open Questions')}
  <table>
    <thead><tr><th>Item</th><th>Type</th><th>Owner</th><th>Resolution Date</th><th>Notes</th></tr></thead>
    <tbody>
      ${data.risksOpenQuestions.map(r => `
      <tr>
        <td>${esc(r.item)}</td>
        <td>${riskBadge(r.type)}</td>
        <td>${esc(r.owner)}</td>
        <td style="font-family:monospace">${esc(r.resolutionDate)}</td>
        <td style="font-size:11px">${esc(r.notes)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<div class="toolbar">
  <button class="btn" onclick="window.print()">↓ Export Stage 3 PDF</button>
</div>

</body>
</html>`;
}

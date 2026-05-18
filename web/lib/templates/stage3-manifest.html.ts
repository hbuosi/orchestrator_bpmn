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
  sections: '§23–29',
})}

<!-- §23 Build-Ready Handoff -->
<div class="section">
  ${sectionHeader('23', 'Build-Ready Handoff')}

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§23.1 Data Contracts</div>
  <table style="margin-bottom:20px">
    <thead><tr><th>Contract Name</th><th>Direction</th><th>Schema Reference</th><th>Notes</th></tr></thead>
    <tbody>
      ${bh.dataContracts.map(dc => `
      <tr>
        <td><strong>${esc(dc.name)}</strong></td>
        <td><span class="badge ${dc.direction === 'Inbound' ? 'pass' : 'manual'}">${esc(dc.direction)}</span></td>
        <td style="font-family:monospace;font-size:11px">${esc(dc.schemaReference) || esc(dc.schemaDescription) || '—'}</td>
        <td style="font-size:11px">${esc(dc.notes) || (dc.mandatoryFields.length ? `Mandatory: ${dc.mandatoryFields.join(', ')}` : '—')}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§23.2 Integration Points</div>
  <table style="margin-bottom:20px">
    <thead><tr><th>External System</th><th>Direction</th><th>Protocol</th><th>Frequency</th><th>Auth</th></tr></thead>
    <tbody>
      ${bh.integrationPoints.map(ip => `
      <tr>
        <td><strong>${esc(ip.system)}</strong></td>
        <td><span class="badge ${ip.direction === 'Inbound' ? 'pass' : ip.direction === 'Outbound' ? 'manual' : 'assisted'}">${esc(ip.direction)}</span></td>
        <td style="font-family:monospace">${esc(ip.protocol)}</td>
        <td>${esc(ip.frequency)}</td>
        <td style="font-family:monospace;font-size:11px">${esc(ip.authentication)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§23.3 Automation Candidates Confirmed</div>
  <table>
    <thead><tr><th>Task ID</th><th>Automation Mode</th><th>Build Approach</th><th>Prerequisites</th></tr></thead>
    <tbody>
      ${bh.automationCandidates.map(ac => `
      <tr>
        <td style="font-family:monospace;font-weight:600">${esc(ac.taskId)}</td>
        <td>${esc(ac.automationMode)}</td>
        <td>${esc(ac.buildApproach)}</td>
        <td><ul style="margin:0;padding-left:14px">${ac.prerequisites.map(p => `<li style="font-size:11px">${esc(p)}</li>`).join('')}</ul></td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- §24 KPI Inheritance -->
<div class="section">
  ${sectionHeader('24', 'KPI Inheritance')}
  <table>
    <thead><tr><th>KPI Name</th><th>Definition</th><th>Source Tasks</th><th>Parent KPI (if any)</th><th>Child KPI (if any)</th></tr></thead>
    <tbody>
      ${data.kpiInheritance.map(k => `
      <tr>
        <td><strong>${esc(k.name)}</strong></td>
        <td style="font-size:11px">${esc(k.definition)}</td>
        <td style="font-size:11px">${k.sourceTasks.join(' → ')}</td>
        <td style="font-size:11px">${esc(k.parentKpi) || '—'}</td>
        <td style="font-size:11px">${esc(k.childKpi) || '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- §25 Operating Model -->
<div class="section page-break">
  ${sectionHeader('25', 'Operating Model')}

  <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§25.1 RACI</div>
  <table>
    <thead><tr><th>Activity</th><th>Responsible</th><th>Accountable</th><th>Consulted</th><th>Informed</th></tr></thead>
    <tbody>
      ${data.operatingModel.raci.map(r => `
      <tr>
        <td><strong>${esc(r.activity)}</strong></td>
        <td>${esc(r.responsible)}</td>
        <td>${esc(r.accountable)}</td>
        <td>${esc(r.consulted) || '—'}</td>
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
        <td>${esc(c.frequency)}</td>
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
    <thead><tr><th>Acceptance Criterion</th><th>Test Approach</th><th>Pass Threshold</th></tr></thead>
    <tbody>
      ${data.acceptanceCriteria.map(ac => `
      <tr>
        <td>${esc(ac.criterion)}</td>
        <td>${esc(ac.testApproach)}</td>
        <td style="font-weight:600;color:var(--s0)">${esc(ac.passThreshold)}</td>
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

${data.serviceFamilyIndex && data.serviceFamilyIndex.length > 0 ? `
<!-- §28 Service Family Index -->
<div class="section">
  ${sectionHeader('28', 'Service Family Index')}
  <table>
    <thead><tr><th>Service ID</th><th>Service Name</th><th>Archetype</th><th>Calls</th><th>Called By</th><th>SLA Target</th><th>Manifest Reference</th></tr></thead>
    <tbody>
      ${data.serviceFamilyIndex.map(s => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(s.serviceId)}</td>
        <td>${esc(s.serviceName)}</td>
        <td>${esc(s.archetype)}</td>
        <td style="font-size:11px">${s.calls.length > 0 ? s.calls.join(', ') : '—'}</td>
        <td style="font-size:11px">${s.calledBy.length > 0 ? s.calledBy.join(', ') : '—'}</td>
        <td style="font-family:monospace">${esc(s.slaTarget)}</td>
        <td style="font-size:11px;font-family:monospace">${esc(s.manifestReference) || '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>` : ''}

${data.serviceDependencyManifest && data.serviceDependencyManifest.length > 0 ? `
<!-- §29 Service Dependency Manifest -->
<div class="section">
  ${sectionHeader('29', 'Service Dependency Manifest')}
  <table>
    <thead><tr><th>Caller</th><th>Called</th><th>Cascade Pattern</th><th>Impact if Called Service Changes</th></tr></thead>
    <tbody>
      ${data.serviceDependencyManifest.map(d => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(d.caller)}</td>
        <td style="font-family:monospace">${esc(d.called)}</td>
        <td><span class="badge ${d.cascadePattern === 'Parallel' ? 'pass' : 'mat-candidate'}">${esc(d.cascadePattern)}</span></td>
        <td style="font-size:11px">${esc(d.impactIfChanged)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>` : ''}

<!-- Appendices -->
${(data.appendixA && data.appendixA.length > 0) || (data.appendixB && data.appendixB.length > 0) || (data.appendixC && data.appendixC.length > 0) || (data.appendixD && data.appendixD.length > 0) ? `
<div style="margin:48px -40px 0;padding:18px 40px;background:#1B2A4A;color:#fff;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.15em">
  ▸ Appendices
</div>` : ''}

${data.appendixA && data.appendixA.length > 0 ? `
<div class="section">
  <div style="margin-bottom:6px">
    <span style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--navy)">Appendix A — Decomposition Decision Log</span>
    <div style="font-style:italic;font-size:12px;color:var(--muted);margin-top:4px">Running history. Append-only.</div>
  </div>
  <table>
    <thead><tr><th>Date</th><th>Decision</th><th>Made By</th><th>Rationale</th><th>Reviewed By</th></tr></thead>
    <tbody>
      ${data.appendixA.map(a => `
      <tr>
        <td style="font-family:monospace">${esc(a.date)}</td>
        <td>${esc(a.decision)}</td>
        <td>${esc(a.madeBy) || '—'}</td>
        <td style="font-size:11px">${esc(a.rationale) || '—'}</td>
        <td>${esc(a.reviewer) || '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>` : ''}

${data.appendixB && data.appendixB.length > 0 ? `
<div class="section">
  <div style="margin-bottom:6px">
    <span style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--navy)">Appendix B — Capacity Scenarios</span>
    <div style="font-style:italic;font-size:12px;color:var(--muted);margin-top:4px">Stress scenarios beyond the baseline capacity in Section 18.</div>
  </div>
  <table>
    <thead><tr><th>Scenario</th><th>Description</th><th>Load Multiplier</th><th>Expected Impact</th><th>Mitigation Strategy</th></tr></thead>
    <tbody>
      ${data.appendixB.map(b => `
      <tr>
        <td><strong>${esc(b.scenario)}</strong></td>
        <td style="font-size:11px">${esc(b.description)}</td>
        <td style="font-family:monospace;text-align:center">${esc(b.loadMultiplier) || '—'}</td>
        <td style="font-size:11px">${esc(b.expectedImpact) || '—'}</td>
        <td style="font-size:11px">${esc(b.mitigationStrategy) || '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>` : ''}

${data.appendixC && data.appendixC.length > 0 ? `
<div class="section">
  <div style="margin-bottom:6px">
    <span style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--navy)">Appendix C — Regulatory Mapping Detail</span>
    <div style="font-style:italic;font-size:12px;color:var(--muted);margin-top:4px">Detailed regulatory citations referenced in Section 12.</div>
  </div>
  <table>
    <thead><tr><th>Regulation</th><th>Citation / Article</th><th>Applicability</th><th>Control Section</th></tr></thead>
    <tbody>
      ${data.appendixC.map(c => `
      <tr>
        <td><strong>${esc(c.regulation)}</strong></td>
        <td style="font-family:monospace;font-size:11px">${[esc(c.citation), esc(c.article)].filter(Boolean).join(' · ') || '—'}</td>
        <td style="font-size:11px">${esc(c.applicability)}</td>
        <td style="font-family:monospace;font-size:11px">${esc(c.controlSection) || '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>` : ''}

${data.appendixD && data.appendixD.length > 0 ? `
<div class="section">
  <div style="margin-bottom:6px">
    <span style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--navy)">Appendix D — Change Log</span>
    <div style="font-style:italic;font-size:12px;color:var(--muted);margin-top:4px">Manifest version history.</div>
  </div>
  <table>
    <thead><tr><th>Version</th><th>Date</th><th>Changed By</th><th>Description</th></tr></thead>
    <tbody>
      ${data.appendixD.map(d => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(d.version)}</td>
        <td style="font-family:monospace">${esc(d.date)}</td>
        <td>${esc(d.changedBy)}</td>
        <td style="font-size:11px">${esc(d.description)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>` : ''}

<div class="toolbar">
  <button class="btn" onclick="window.print()">↓ Export Stage 3 PDF</button>
</div>

</body>
</html>`;
}

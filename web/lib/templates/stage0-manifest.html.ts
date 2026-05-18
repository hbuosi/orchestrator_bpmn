import type { Stage0 } from '../schemas/manifest.schema';
import { esc, bool, MANIFEST_CSS, docHeader, sectionHeader } from './manifest-shared';

export function stage0ManifestTemplate(data: Stage0): string {
  const si = data.serviceIdentification;
  const jc = data.customerJourneyContext;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(si.serviceCode)} — Stage 0 Service Definition</title>
${MANIFEST_CSS}
</head>
<body>

${docHeader({
  serviceCode: si.serviceCode,
  title: si.nameEn,
  subtitle: si.nameAr,
  stageBadge: 'Stage 0 — Service Definition',
  stageClass: 's0',
  sections: '§1–7',
})}

<!-- §1 Service Identification -->
<div class="section">
  ${sectionHeader('1', 'Service Identification')}
  <div class="kv-grid">
    <div class="k">Service ID</div><div class="v">${esc(si.serviceCode)}</div>
    <div class="k">Service Name</div><div class="v">${esc(si.nameEn)}</div>
    <div class="k">Name (Arabic)</div><div class="v" style="font-family:serif;direction:rtl;text-align:right">${esc(si.nameAr)}</div>
    <div class="k">Domain / Function</div><div class="v">${esc(si.domain) || '—'}</div>
    <div class="k">Category</div><div class="v">${esc(si.category)}</div>
    <div class="k">Owning Entity</div><div class="v">${esc(si.owningEntity)}</div>
    <div class="k">Service Owner</div><div class="v">${esc(si.serviceOwner) || '—'}</div>
    <div class="k">Service Sponsor</div><div class="v">${esc(si.serviceSponsor) || '—'}</div>
    <div class="k">Customer Type</div><div class="v">${esc(si.customerType) || '—'}</div>
    <div class="k">Service Purpose</div><div class="v">${esc(si.servicePurpose) || '—'}</div>
    <div class="k">Trigger</div><div class="v">${esc(si.trigger)}</div>
    <div class="k">Outcome (success)</div><div class="v">${esc(si.outcome)}</div>
    <div class="k">Outcome (rejection)</div><div class="v">${esc(si.outcomeRejection) || '—'}</div>
  </div>

  <div style="margin-top:16px">
    <table>
      <thead><tr><th>In Scope</th><th>Out of Scope</th></tr></thead>
      <tbody><tr>
        <td><ul>${si.boundary.inScope.map(s => `<li>${esc(s)}</li>`).join('')}</ul></td>
        <td><ul>${si.boundary.outOfScope.map(s => `<li>${esc(s)}</li>`).join('')}</ul></td>
      </tr></tbody>
    </table>
  </div>
</div>

<!-- §2 Customer Journey Context -->
<div class="section">
  ${sectionHeader('2', 'Customer Journey Context')}
  <table>
    <thead><tr><th>Stage of Journey</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td><strong>Trigger Event</strong></td><td>${esc(jc.triggerEvent) || esc(jc.journeyPhase) || '—'}</td></tr>
      <tr><td><strong>Touchpoint Channel</strong></td><td>${esc(jc.touchpointChannel) || (jc.touchpoints.length ? jc.touchpoints.join(', ') : '—')}</td></tr>
      <tr><td><strong>Customer Mindset</strong></td><td>${esc(jc.customerMindset) || '—'}</td></tr>
      <tr><td><strong>Adjacent Services</strong></td><td>${esc(jc.adjacentServices) || [jc.precedingService, jc.followingService].filter(Boolean).join(' / ') || '—'}</td></tr>
      <tr><td><strong>Customer Effort Score Target</strong></td><td>${esc(jc.customerEffortScore) || '—'}</td></tr>
      <tr><td><strong>Journey Map Reference</strong></td><td>${esc(jc.journeyMapReference) || '—'}</td></tr>
    </tbody>
  </table>
  ${jc.painPoints.length > 0 ? `<div style="margin-top:14px"><div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">Pain Points</div><ul>${jc.painPoints.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>` : ''}
</div>

<!-- §3 Capability Reuse Search -->
<div class="section">
  ${sectionHeader('3', 'Capability Reuse Search')}
  <table>
    <thead><tr><th>Search Term / Function Needed</th><th>Existing Capability Found</th><th>Decision (Consume/Fork/New)</th><th>Rationale</th></tr></thead>
    <tbody>
      ${data.capabilityReuseSearch.map(r => `
      <tr>
        <td>${esc(r.searchTerm)}</td>
        <td>${r.matchFound ? `✓ ${esc(r.matchName)}` : '✗ None'}</td>
        <td><span class="badge ${r.decision === 'new' ? 'mat-candidate' : r.decision === 'consume' ? 'pass' : 'assisted'}">${esc(r.decision)}</span></td>
        <td>${esc(r.rationale)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- §4 Demand & Capacity Profile -->
<div class="section">
  ${sectionHeader('4', 'Demand & Capacity Profile')}
  <div class="kv-grid">
    <div class="k">Annual Volume (estimate)</div><div class="v">${esc(data.demandProfile.annualVolume.toLocaleString())} requests/year${data.demandProfile.volumeBasis ? ` <span style="color:var(--muted);font-size:11px">(${esc(data.demandProfile.volumeBasis)})</span>` : ''}</div>
    <div class="k">Daily Average</div><div class="v">${esc(data.demandProfile.dailyAverage) || '—'}</div>
    <div class="k">Peak Day</div><div class="v">${esc(data.demandProfile.peakDay) || '—'}</div>
    <div class="k">Peak Period</div><div class="v">${data.demandProfile.peakPeriods.map(p => `<span class="tag">${esc(p)}</span>`).join(' ')}</div>
    <div class="k">Channel Mix</div><div class="v">${esc(data.demandProfile.channelMix) || data.demandProfile.channels.map(c => `<span class="tag">${esc(c)}</span>`).join(' ') || '—'}</div>
    <div class="k">Customer Segments</div><div class="v">${esc(data.demandProfile.customerSegments) || '—'}</div>
    <div class="k">Capacity Constraints</div><div class="v">${esc(data.demandProfile.capacityConstraints) || esc(data.demandProfile.capacityBaseline) || '—'}</div>
    <div class="k">Seasonality / Variability</div><div class="v">${esc(data.demandProfile.seasonalityVariability) || '—'}</div>
  </div>
</div>

<!-- §5 As-Is Process Analysis -->
<div class="section">
  ${sectionHeader('5', 'As-Is Process Analysis')}
  ${(() => {
    const ap = data.asIsProcessAnalysis;
    if (ap && ap.applicable === false) {
      return `<div style="font-style:italic;color:var(--muted);padding:12px 0">✗ Not applicable — greenfield service</div>`;
    }
    return `<div class="kv-grid">
    <div class="k">Current Process Owner</div><div class="v">${esc(ap?.currentProcessOwner) || '—'}</div>
    <div class="k">Current Volume</div><div class="v">${esc(ap?.currentVolume) || '—'}</div>
    <div class="k">Current Cycle Time</div><div class="v">${esc(ap?.currentCycleTime) || '—'}</div>
    <div class="k">Current Pain Points</div><div class="v">${ap?.knownPainPoints && ap.knownPainPoints.length > 0 ? `<ul>${ap.knownPainPoints.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : esc(ap?.currentStateDescription) || '—'}</div>
    <div class="k">Current Tooling</div><div class="v">${esc(ap?.currentTooling) || '—'}</div>
    <div class="k">Current SLA Performance</div><div class="v">${esc(ap?.currentSlaPerformance) || '—'}</div>
    <div class="k">What Must Be Preserved</div><div class="v">${esc(ap?.whatMustBePreserved) || '—'}</div>
    <div class="k">What Must Change</div><div class="v">${esc(ap?.whatMustChange) || esc(ap?.replacementRationale) || '—'}</div>
  </div>`;
  })()}
</div>

<!-- §6 Data Inventory -->
<div class="section">
  ${sectionHeader('6', 'Data Inventory')}
  <table>
    <thead><tr><th>Data Element</th><th>Action (C/R/U/D)</th><th>Source/Sink System</th><th>Sensitivity</th><th>Retention</th></tr></thead>
    <tbody>
      ${data.dataInventory.map(d => `
      <tr>
        <td>${esc(d.dataElement)}</td>
        <td style="font-family:monospace">${[d.creates?'C':'', d.reads?'R':'', d.updates?'U':'', d.deletes?'D':''].filter(Boolean).join('/')}</td>
        <td>${esc(d.sourceSinkSystem) || '—'}</td>
        <td>${esc(d.classification)}</td>
        <td>${esc(d.retention) || (d.retentionDays ? d.retentionDays + ' days' : '—')}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- §7 Stakeholder & Persona Map -->
<div class="section">
  ${sectionHeader('7', 'Stakeholder & Persona Map')}
  <table>
    <thead><tr><th>Persona / Stakeholder</th><th>Role in This Service</th><th>Engagement Level</th><th>Decision Rights</th></tr></thead>
    <tbody>
      ${data.stakeholderMap.map(s => `
      <tr>
        <td><strong>${esc(s.role)}</strong>${s.organization ? `<br><span style="font-size:11px;color:var(--muted)">${esc(s.organization)}</span>` : ''}</td>
        <td><ul style="margin:0;padding-left:16px">${s.responsibilities.map(r => `<li>${esc(r)}</li>`).join('')}</ul></td>
        <td>${esc(s.engagementLevel) || `<span class="badge ${s.type === 'approver' ? 'pass' : s.type === 'escalation' ? 'risk-risk' : 'mat-candidate'}">${esc(s.type)}</span>`}</td>
        <td>${esc(s.decisionRights) || '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<div class="toolbar">
  <button class="btn" onclick="window.print()">↓ Export Stage 0 PDF</button>
</div>

</body>
</html>`;
}

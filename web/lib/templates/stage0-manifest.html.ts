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
    <div class="k">Service Code</div><div class="v">${esc(si.serviceCode)}</div>
    <div class="k">Name (English)</div><div class="v">${esc(si.nameEn)}</div>
    <div class="k">Name (Arabic)</div><div class="v" style="font-family:serif;direction:rtl;text-align:right">${esc(si.nameAr)}</div>
    <div class="k">Category</div><div class="v">${esc(si.category)}</div>
    <div class="k">Owning Entity</div><div class="v">${esc(si.owningEntity)}</div>
    <div class="k">Trigger</div><div class="v">${esc(si.trigger)}</div>
    <div class="k">Outcome</div><div class="v">${esc(si.outcome)}</div>
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
  <div class="kv-grid">
    <div class="k">Journey Phase</div><div class="v">${esc(jc.journeyPhase)}</div>
    ${jc.precedingService ? `<div class="k">Preceding Service</div><div class="v">${esc(jc.precedingService)}</div>` : ''}
    ${jc.followingService ? `<div class="k">Following Service</div><div class="v">${esc(jc.followingService)}</div>` : ''}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
    <div>
      <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">Touchpoints</div>
      <ul>${jc.touchpoints.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    </div>
    <div>
      <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">Pain Points</div>
      <ul>${jc.painPoints.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
    </div>
  </div>
</div>

<!-- §3 Capability Reuse Search -->
<div class="section">
  ${sectionHeader('3', 'Capability Reuse Search')}
  <table>
    <thead><tr><th>Search Term</th><th>Match Found?</th><th>Match Name</th><th>Decision</th><th>Rationale</th></tr></thead>
    <tbody>
      ${data.capabilityReuseSearch.map(r => `
      <tr>
        <td>${esc(r.searchTerm)}</td>
        <td>${r.matchFound ? '✓ Yes' : '✗ No'}</td>
        <td>${esc(r.matchName)}</td>
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
    <div class="k">Annual Volume</div><div class="v">${esc(data.demandProfile.annualVolume.toLocaleString())}</div>
    <div class="k">Volume Basis</div><div class="v">${esc(data.demandProfile.volumeBasis)}</div>
    <div class="k">Peak Periods</div><div class="v">${data.demandProfile.peakPeriods.map(p => `<span class="tag">${esc(p)}</span>`).join(' ')}</div>
    <div class="k">Channels</div><div class="v"><div class="tag-list">${data.demandProfile.channels.map(c => `<span class="tag">${esc(c)}</span>`).join('')}</div></div>
    <div class="k">Capacity Baseline</div><div class="v">${esc(data.demandProfile.capacityBaseline)}</div>
  </div>
</div>

<!-- §6 Data Inventory -->
<div class="section">
  ${sectionHeader('6', 'Data Inventory')}
  <table>
    <thead><tr><th>Data Element</th><th>C</th><th>R</th><th>U</th><th>D</th><th>Classification</th><th>Retention (days)</th></tr></thead>
    <tbody>
      ${data.dataInventory.map(d => `
      <tr>
        <td>${esc(d.dataElement)}</td>
        <td style="text-align:center">${bool(d.creates)}</td>
        <td style="text-align:center">${bool(d.reads)}</td>
        <td style="text-align:center">${bool(d.updates)}</td>
        <td style="text-align:center">${bool(d.deletes)}</td>
        <td>${esc(d.classification)}</td>
        <td>${d.retentionDays != null ? esc(d.retentionDays) : '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- §7 Stakeholder & Persona Map -->
<div class="section">
  ${sectionHeader('7', 'Stakeholder & Persona Map')}
  <table>
    <thead><tr><th>Role</th><th>Type</th><th>Responsibilities</th><th>Organization</th></tr></thead>
    <tbody>
      ${data.stakeholderMap.map(s => `
      <tr>
        <td><strong>${esc(s.role)}</strong></td>
        <td><span class="badge ${s.type === 'approver' ? 'pass' : s.type === 'escalation' ? 'risk-risk' : 'mat-candidate'}">${esc(s.type)}</span></td>
        <td><ul>${s.responsibilities.map(r => `<li>${esc(r)}</li>`).join('')}</ul></td>
        <td>${esc(s.organization)}</td>
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

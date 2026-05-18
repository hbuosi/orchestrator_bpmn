import type { ServiceManifest } from '../schemas/manifest.schema';
import { esc, bool, MANIFEST_CSS, sectionHeader, maturityBadge, digitizationBadge, riskBadge } from './manifest-shared';

function escBpmn(xml: string): string {
  return xml.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

const NAV_CSS = `
<style>
.nav-sidebar {
  position: fixed; left: 0; top: 0; bottom: 0; width: 200px;
  background: #1B2A4A; color: #fff; overflow-y: auto;
  padding: 20px 0; z-index: 200;
  font-family: "JetBrains Mono", monospace;
}
.nav-section { font-size: 9px; text-transform: uppercase; letter-spacing: .15em; color: rgba(255,255,255,.4); padding: 16px 16px 4px; }
.nav-link { display: block; font-size: 11px; padding: 5px 16px; color: rgba(255,255,255,.75); text-decoration: none; border-left: 2px solid transparent; }
.nav-link:hover { background: rgba(255,255,255,.08); color: #fff; border-left-color: rgba(255,255,255,.4); }
.nav-link.s0 { border-left-color: transparent; }
.nav-link.s0:hover { border-left-color: #2E7D32; }
.nav-link.s1:hover { border-left-color: #1565C0; }
.nav-link.s2:hover { border-left-color: #E65100; }
.nav-link.s3:hover { border-left-color: #6A1B9A; }
.main-content { margin-left: 200px; }
.stage-divider {
  margin: 48px -40px 36px;
  padding: 18px 40px;
  font-family: "JetBrains Mono", monospace;
  font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .15em;
  color: #fff;
}
.stage-divider.s0 { background: #2E7D32; }
.stage-divider.s1 { background: #1565C0; }
.stage-divider.s2 { background: #E65100; }
.stage-divider.s3 { background: #6A1B9A; }
@media print {
  .nav-sidebar { display: none; }
  .main-content { margin-left: 0; }
  .stage-divider { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>`;

export function completeManifestTemplate(manifest: ServiceManifest, bpmnXml: string): string {
  const si = manifest.stage0.serviceIdentification;
  const dd = manifest.stage1.decompositionDecision;
  const ot = manifest.stage1.outcomeTargets;
  const bh = manifest.stage3.buildHandoff;
  const escaped = escBpmn(bpmnXml);
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(si.serviceCode)} — Complete Service Manifest v2.6</title>
<link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.16.0/dist/assets/diagram-js.css">
<link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.16.0/dist/assets/bpmn-js.css">
<link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.16.0/dist/assets/bpmn-font/css/bpmn.css">
${MANIFEST_CSS}
${NAV_CSS}
</head>
<body>

<!-- Navigation sidebar -->
<nav class="nav-sidebar">
  <div style="padding:16px;border-bottom:1px solid rgba(255,255,255,.1);margin-bottom:8px">
    <div style="font-size:9px;text-transform:uppercase;letter-spacing:.15em;color:rgba(255,255,255,.4);margin-bottom:4px">Service Manifest v2.6</div>
    <div style="font-size:12px;font-weight:600;color:#fff">${esc(si.serviceCode)}</div>
  </div>
  <div class="nav-section">Stage 0 — Definition</div>
  <a class="nav-link s0" href="#s1">§1 Identification</a>
  <a class="nav-link s0" href="#s2">§2 Journey Context</a>
  <a class="nav-link s0" href="#s3">§3 Reuse Search</a>
  <a class="nav-link s0" href="#s4">§4 Demand Profile</a>
  <a class="nav-link s0" href="#s5">§5 As-Is Analysis</a>
  <a class="nav-link s0" href="#s6">§6 Data Inventory</a>
  <a class="nav-link s0" href="#s7">§7 Stakeholders</a>
  <div class="nav-section">Stage 1 — Design</div>
  <a class="nav-link s1" href="#s8">§8 Decomposition</a>
  <a class="nav-link s1" href="#s9">§9 Boundary</a>
  <a class="nav-link s1" href="#s10">§10 Value Stream</a>
  <a class="nav-link s1" href="#s11">§11 Outcome Targets</a>
  <a class="nav-link s1" href="#s12">§12 Audit Drivers</a>
  <a class="nav-link s1" href="#s13">§13 Lifecycle</a>
  <div class="nav-section">Stage 2 — Task Model</div>
  <a class="nav-link s2" href="#s14">§14 Module Register</a>
  <a class="nav-link s2" href="#s15">§15 Task Register</a>
  <a class="nav-link s2" href="#s16">§16 Loop Governance</a>
  <a class="nav-link s2" href="#s17">§17 Exception Paths</a>
  <a class="nav-link s2" href="#s18">§18 Capacity Assumptions</a>
  <a class="nav-link s2" href="#s19">§19 Severity-Tier Rec.</a>
  <a class="nav-link s2" href="#s20">§20 Workflow / BPMN</a>
  <a class="nav-link s2" href="#s21">§21 Subflow Alignment</a>
  <a class="nav-link s2" href="#s22">§22 Pattern Drift</a>
  <div class="nav-section">Stage 3 — Build</div>
  <a class="nav-link s3" href="#s23">§23 Build Handoff</a>
  <a class="nav-link s3" href="#s24">§24 KPI Inheritance</a>
  <a class="nav-link s3" href="#s25">§25 Operating Model</a>
  <a class="nav-link s3" href="#s26">§26 Acceptance</a>
  <a class="nav-link s3" href="#s27">§27 Risks</a>
</nav>

<div class="main-content">

<!-- Document header -->
<div class="doc-header" style="background:#1B2A4A">
  <div class="doc-header-left">
    <div class="doc-kicker">DGE Service Orchestrator · Business Service Design Framework v2.6 · Complete Service Manifest</div>
    <div class="doc-title">${esc(si.nameEn)}</div>
    <div class="doc-subtitle">${esc(si.nameAr)} · ${esc(si.owningEntity)}</div>
  </div>
  <div class="doc-meta">
    <div style="margin-bottom:6px"><span class="badge arch-${dd.archetype === 'Capability' ? 'cap' : dd.archetype === 'Composite' ? 'comp' : 'orch'}" style="background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.3)">${esc(dd.archetype)}</span></div>
    <div>§1–27 · All Stages</div>
    <div>Sections §1–27</div>
    <div>${today}</div>
  </div>
</div>

<!-- ════════════════ STAGE 0 ════════════════ -->
<div class="stage-divider s0">▸ Stage 0 — Service Definition · §1–7</div>

<div id="s1" class="section">
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
  <div style="margin-top:14px">
    <table><thead><tr><th>In Scope</th><th>Out of Scope</th></tr></thead>
    <tbody><tr>
      <td><ul>${si.boundary.inScope.map(s => `<li>${esc(s)}</li>`).join('')}</ul></td>
      <td><ul>${si.boundary.outOfScope.map(s => `<li>${esc(s)}</li>`).join('')}</ul></td>
    </tr></tbody></table>
  </div>
</div>

<div id="s2" class="section">
  ${sectionHeader('2', 'Customer Journey Context')}
  ${(() => { const jc = manifest.stage0.customerJourneyContext; return `
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
  ${jc.painPoints.length > 0 ? `<div style="margin-top:14px"><div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px">Pain Points</div><ul>${jc.painPoints.map((p: string) => `<li>${esc(p)}</li>`).join('')}</ul></div>` : ''}
  `; })()}
</div>

<div id="s3" class="section">
  ${sectionHeader('3', 'Capability Reuse Search')}
  <table><thead><tr><th>Search Term / Function Needed</th><th>Existing Capability Found</th><th>Decision (Consume/Fork/New)</th><th>Rationale</th></tr></thead>
  <tbody>${manifest.stage0.capabilityReuseSearch.map(r => `<tr><td>${esc(r.searchTerm)}</td><td>${r.matchFound ? `✓ ${esc(r.matchName)}` : '✗ None'}</td><td><span class="badge ${r.decision === 'new' ? 'mat-candidate' : r.decision === 'consume' ? 'pass' : 'assisted'}">${esc(r.decision)}</span></td><td>${esc(r.rationale)}</td></tr>`).join('')}</tbody></table>
</div>

<div id="s4" class="section">
  ${sectionHeader('4', 'Demand & Capacity Profile')}
  ${(() => { const dp = manifest.stage0.demandProfile; return `
  <div class="kv-grid">
    <div class="k">Annual Volume (estimate)</div><div class="v">${esc(dp.annualVolume.toLocaleString())} requests/year${dp.volumeBasis ? ` <span style="color:var(--muted);font-size:11px">(${esc(dp.volumeBasis)})</span>` : ''}</div>
    <div class="k">Daily Average</div><div class="v">${esc(dp.dailyAverage) || '—'}</div>
    <div class="k">Peak Day</div><div class="v">${esc(dp.peakDay) || '—'}</div>
    <div class="k">Peak Period</div><div class="v">${dp.peakPeriods.map((p: string) => `<span class="tag">${esc(p)}</span>`).join(' ')}</div>
    <div class="k">Channel Mix</div><div class="v">${esc(dp.channelMix) || dp.channels.map((c: string) => `<span class="tag">${esc(c)}</span>`).join(' ') || '—'}</div>
    <div class="k">Customer Segments</div><div class="v">${esc(dp.customerSegments) || '—'}</div>
    <div class="k">Capacity Constraints</div><div class="v">${esc(dp.capacityConstraints) || esc(dp.capacityBaseline) || '—'}</div>
    <div class="k">Seasonality / Variability</div><div class="v">${esc(dp.seasonalityVariability) || '—'}</div>
  </div>`; })()}
</div>

<div id="s5" class="section">
  ${sectionHeader('5', 'As-Is Process Analysis')}
  ${(() => {
    const ap = manifest.stage0.asIsProcessAnalysis;
    if (ap && ap.applicable === false) return `<div style="font-style:italic;color:var(--muted);padding:12px 0">✗ Not applicable — greenfield service</div>`;
    return `<div class="kv-grid">
    <div class="k">Current Process Owner</div><div class="v">${esc(ap?.currentProcessOwner) || '—'}</div>
    <div class="k">Current Volume</div><div class="v">${esc(ap?.currentVolume) || '—'}</div>
    <div class="k">Current Cycle Time</div><div class="v">${esc(ap?.currentCycleTime) || '—'}</div>
    <div class="k">Current Pain Points</div><div class="v">${ap?.knownPainPoints && ap.knownPainPoints.length > 0 ? `<ul>${ap.knownPainPoints.map((p: string) => `<li>${esc(p)}</li>`).join('')}</ul>` : esc(ap?.currentStateDescription) || '—'}</div>
    <div class="k">Current Tooling</div><div class="v">${esc(ap?.currentTooling) || '—'}</div>
    <div class="k">Current SLA Performance</div><div class="v">${esc(ap?.currentSlaPerformance) || '—'}</div>
    <div class="k">What Must Be Preserved</div><div class="v">${esc(ap?.whatMustBePreserved) || '—'}</div>
    <div class="k">What Must Change</div><div class="v">${esc(ap?.whatMustChange) || esc(ap?.replacementRationale) || '—'}</div>
  </div>`;
  })()}
</div>

<div id="s6" class="section">
  ${sectionHeader('6', 'Data Inventory')}
  <table><thead><tr><th>Data Element</th><th>Action (C/R/U/D)</th><th>Source/Sink System</th><th>Sensitivity</th><th>Retention</th></tr></thead>
  <tbody>${manifest.stage0.dataInventory.map(d => `<tr><td>${esc(d.dataElement)}</td><td style="font-family:monospace">${[d.creates?'C':'', d.reads?'R':'', d.updates?'U':'', d.deletes?'D':''].filter(Boolean).join('/')}</td><td>${esc(d.sourceSinkSystem) || '—'}</td><td>${esc(d.classification)}</td><td>${esc(d.retention) || (d.retentionDays ? d.retentionDays + ' days' : '—')}</td></tr>`).join('')}</tbody></table>
</div>

<div id="s7" class="section">
  ${sectionHeader('7', 'Stakeholder & Persona Map')}
  <table><thead><tr><th>Persona / Stakeholder</th><th>Role in This Service</th><th>Engagement Level</th><th>Decision Rights</th></tr></thead>
  <tbody>${manifest.stage0.stakeholderMap.map(s => `<tr><td><strong>${esc(s.role)}</strong>${s.organization ? `<br><span style="font-size:11px;color:var(--muted)">${esc(s.organization)}</span>` : ''}</td><td><ul style="margin:0;padding-left:16px">${s.responsibilities.map((r: string) => `<li>${esc(r)}</li>`).join('')}</ul></td><td>${esc(s.engagementLevel) || `<span class="badge ${s.type === 'approver' ? 'pass' : s.type === 'escalation' ? 'risk-risk' : 'mat-candidate'}">${esc(s.type)}</span>`}</td><td>${esc(s.decisionRights) || '—'}</td></tr>`).join('')}</tbody></table>
</div>

<!-- ════════════════ STAGE 1 ════════════════ -->
<div class="stage-divider s1">▸ Stage 1 — Service Design · §8–13</div>

<div id="s8" class="section">
  ${sectionHeader('8', 'Decomposition Decision')}
  <div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§8.1 Archetype Declaration</div>
  <table style="margin-bottom:16px"><thead><tr><th>Field</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td>Declared Archetype</td><td><span class="badge arch-${dd.archetype === 'Capability' ? 'cap' : dd.archetype === 'Composite' ? 'comp' : 'orch'}">${esc(dd.archetype)}</span></td></tr>
    <tr><td>Decision Date</td><td>${esc(dd.decisionDate) || '—'}</td></tr>
    <tr><td>Decision Made By</td><td>${esc(dd.decisionMadeBy) || '—'}</td></tr>
    <tr><td>Rationale (1 paragraph)</td><td>${esc(dd.rationale)}</td></tr>
  </tbody></table>
  <div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§8.2 Boundary Smell Tests</div>
  <table><thead><tr><th>Test</th><th>Result</th><th>Notes</th></tr></thead>
  <tbody>${dd.smellTests.map(t => `<tr><td>${esc(t.test)}</td><td><span class="badge ${t.result}">${esc(t.result.toUpperCase())}</span></td><td>${esc(t.notes)}</td></tr>`).join('')}</tbody></table>
  ${dd.calledServices.length > 0 ? `<div style="margin-top:10px"><div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px">Called Services</div><div class="tag-list">${dd.calledServices.map(s => `<span class="tag">${esc(s)}</span>`).join('')}</div></div>` : ''}
  <div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:14px 0 8px">§8.3 Decision Log</div>
  <table><thead><tr><th>Date</th><th>Decision</th><th>Reviewer</th></tr></thead>
  <tbody>${dd.decisionLog.map(l => `<tr><td style="font-family:monospace">${esc(l.date)}</td><td>${esc(l.decision)}</td><td>${esc(l.reviewer)}</td></tr>`).join('')}</tbody></table>
</div>

<div id="s9" class="section">
  ${sectionHeader('9', 'Service Boundary & Interfaces')}
  <div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§9.1 Inputs</div>
  <table style="margin-bottom:16px"><thead><tr><th>Name</th><th>Format</th><th>Source</th></tr></thead><tbody>${manifest.stage1.serviceBoundary.inputs.map(i => `<tr><td>${esc(i.name)}</td><td>${esc(i.format)}</td><td>${esc(i.source)}</td></tr>`).join('')}</tbody></table>
  <div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§9.2 Outputs</div>
  <table style="margin-bottom:16px"><thead><tr><th>Name</th><th>Format</th><th>Destination</th></tr></thead><tbody>${manifest.stage1.serviceBoundary.outputs.map(o => `<tr><td>${esc(o.name)}</td><td>${esc(o.format)}</td><td>${esc(o.destination)}</td></tr>`).join('')}</tbody></table>
  ${manifest.stage1.serviceBoundary.calledServices.length > 0 ? `<div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§9.3 Called Services (Composite/Orchestrating)</div><table><thead><tr><th>Called Service</th><th>Cascade Pattern</th><th>OLA</th></tr></thead><tbody>${manifest.stage1.serviceBoundary.calledServices.map(s => `<tr><td>${esc(s.service)}</td><td>${esc(s.cascadePattern)}</td><td style="font-family:monospace">${esc(s.ola)}</td></tr>`).join('')}</tbody></table>` : ''}
</div>

<div id="s10" class="section">
  ${sectionHeader('10', 'Value Stream & Customer Journey')}
  <table><thead><tr><th>#</th><th>Phase</th><th>Customer Activity</th><th>Service Activity</th></tr></thead>
  <tbody>${manifest.stage1.valueStream.map(v => `<tr><td style="font-family:monospace;font-weight:600;color:var(--navy)">${v.phase}</td><td><strong>${esc(v.name)}</strong></td><td>${esc(v.customerActivity)}</td><td>${esc(v.serviceActivity)}</td></tr>`).join('')}</tbody></table>
</div>

<div id="s11" class="section">
  ${sectionHeader('11', 'Experience & Outcome Targets')}
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:16px">
    <div class="info-box" style="text-align:center"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:4px">Stated SLA</div><div style="font-size:26px;font-weight:700;color:var(--navy)">${esc(ot.statedSlaDays)} <span style="font-size:13px;font-weight:400">days</span></div></div>
    <div class="info-box" style="text-align:center"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:4px">Computed SLA</div><div style="font-size:26px;font-weight:700;color:var(--navy)">${esc(ot.computedSlaDays)} <span style="font-size:13px;font-weight:400">days</span></div></div>
    <div class="info-box" style="text-align:center;border-left-color:${ot.variance === 0 ? 'var(--s0)' : 'var(--s2)'}"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:4px">Variance</div><div style="font-size:26px;font-weight:700;color:${ot.variance === 0 ? 'var(--s0)' : 'var(--s2)'}">${ot.variance >= 0 ? '+' : ''}${esc(ot.variance)} <span style="font-size:13px;font-weight:400">days</span></div></div>
  </div>
  ${ot.varianceJustification ? `<div class="info-box" style="margin-bottom:14px"><strong>Variance Justification:</strong> ${esc(ot.varianceJustification)}</div>` : ''}
  <div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§11.2 SLA Cascade Arithmetic</div>
  <table><thead><tr><th>OLA Component</th><th>OLA (days)</th><th>Execution Mode</th></tr></thead>
  <tbody>${ot.olaBreakdown.map(o => `<tr><td>${esc(o.service)}</td><td style="font-family:monospace;font-weight:600">${esc(o.olaDays)}</td><td><span class="badge ${o.executionMode === 'Parallel' ? 'pass' : 'mat-candidate'}">${esc(o.executionMode)}</span></td></tr>`).join('')}<tr style="font-weight:700;background:var(--paper-2)"><td>Total</td><td style="font-family:monospace">${esc(ot.computedSlaDays)}</td><td>—</td></tr></tbody></table>
</div>

<div id="s12" class="section">
  ${sectionHeader('12', 'Audit & Regulatory Drivers')}
  <table><thead><tr><th>Control Step</th><th>Regulation</th><th>Evidence Required</th><th>Retention</th></tr></thead>
  <tbody>${manifest.stage1.auditDrivers.map(a => `<tr><td>${esc(a.controlStep)}</td><td>${esc(a.regulation)}</td><td>${esc(a.evidenceRequired)}</td><td style="font-family:monospace;text-align:center">${esc(a.retentionDays)}d</td></tr>`).join('')}</tbody></table>
</div>

<div id="s13" class="section">
  ${sectionHeader('13', 'Service Lifecycle Stage')}
  <div class="kv-grid">
    <div class="k">Current Stage</div><div class="v"><span class="badge ${manifest.stage1.lifecycleStage.stage === 'Operating' ? 'pass' : 'mat-candidate'}">${esc(manifest.stage1.lifecycleStage.stage)}</span></div>
    <div class="k">Annual Review</div><div class="v">${esc(manifest.stage1.lifecycleStage.annualReviewDate)}</div>
  </div>
</div>

<!-- ════════════════ STAGE 2 ════════════════ -->
<div class="stage-divider s2">▸ Stage 2 — Task Model & Workflow · §14–22</div>

<div id="s14" class="section">
  ${sectionHeader('14', 'Module Register')}
  <table><thead><tr><th>ID</th><th>Module</th><th>Description</th><th>OLA</th><th>Subflow</th><th>Maturity</th></tr></thead>
  <tbody>${manifest.stage2.moduleRegister.map(m => `<tr><td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(m.moduleId)}</td><td><strong>${esc(m.name)}</strong></td><td>${esc(m.description)}</td><td style="font-family:monospace">${esc(m.ola)}</td><td>${esc(m.alignedSubflow)}</td><td>${maturityBadge(m.subflowMaturity)}</td></tr>`).join('')}</tbody></table>
</div>

<div id="s15" class="section">
  ${sectionHeader('15', 'Task Register')}
  <table><thead><tr><th>ID</th><th>Module</th><th>Task</th><th>Type</th><th>Mode</th><th>OLA</th><th>Lane</th><th>Capacity</th><th>Exception Path</th><th>Auto?</th></tr></thead>
  <tbody>${manifest.stage2.taskRegister.map(t => `<tr><td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(t.taskId)}</td><td style="font-family:monospace;font-size:11px;color:var(--muted)">${esc(t.moduleId)}</td><td><strong>${esc(t.name)}</strong><br><span style="font-size:11px;color:var(--muted)">${esc(t.description)}</span></td><td style="font-family:monospace;font-size:11px">${esc(t.taskTypeCode)}</td><td>${digitizationBadge(t.digitizationMode)}</td><td style="font-family:monospace">${esc(t.olaCompact)}</td><td style="font-size:11px;color:var(--muted)">${esc(t.lane)}</td><td style="font-size:11px">${esc(t.capacityAssumption)}</td><td style="font-size:11px">${esc(t.exceptionPath)}</td><td style="text-align:center">${bool(t.automationCandidate)}</td></tr>`).join('')}</tbody></table>
</div>

${manifest.stage2.loopGovernance.length > 0 ? `
<div id="s16" class="section">
  ${sectionHeader('16', 'Loop Governance')}
  <table><thead><tr><th>Loop ID</th><th>Type</th><th>Re-entry</th><th>Max Cycles</th><th>Timeout</th><th>Clock</th><th>Escalation</th><th>Reason Codes</th></tr></thead>
  <tbody>${manifest.stage2.loopGovernance.map(l => `<tr><td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(l.loopId)}</td><td>${esc(l.type)}</td><td style="font-family:monospace">${esc(l.reentryTaskId)}</td><td style="text-align:center;font-weight:700">${esc(l.maxCycles)}</td><td>${esc(l.timeout)}</td><td><span class="badge mat-candidate">${esc(l.clockPolicy)}</span></td><td>${esc(l.escalationPath)}</td><td style="font-size:11px">${l.reasonCodes && l.reasonCodes.length > 0 ? l.reasonCodes.map((rc: string) => `<span class="tag">${esc(rc)}</span>`).join(' ') : '—'}</td></tr>`).join('')}</tbody></table>
</div>` : ''}

<div id="s17" class="section">
  ${sectionHeader('17', 'Exception Pathways')}
  <table><thead><tr><th>Task ID</th><th>Task Name</th><th>Exception Path</th></tr></thead>
  <tbody>${manifest.stage2.taskRegister.map(t => `<tr><td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(t.taskId)}</td><td>${esc(t.name)}</td><td style="font-size:11px">${esc(t.exceptionPath) || '—'}</td></tr>`).join('')}</tbody></table>
</div>

<div id="s18" class="section">
  ${sectionHeader('18', 'Capacity Assumptions')}
  <table><thead><tr><th>Task ID</th><th>Task Name</th><th>OLA Compact</th><th>Capacity Assumption</th></tr></thead>
  <tbody>${manifest.stage2.taskRegister.map(t => `<tr><td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(t.taskId)}</td><td>${esc(t.name)}</td><td style="font-family:monospace">${esc(t.olaCompact)}</td><td style="font-size:11px">${esc(t.capacityAssumption) || '—'}</td></tr>`).join('')}</tbody></table>
</div>

${manifest.stage2.severityTierReconciliation && manifest.stage2.severityTierReconciliation.length > 0 ? `
<div id="s19" class="section">
  ${sectionHeader('19', 'Severity-Tier Reconciliation')}
  ${manifest.stage2.severityTierReconciliation.map(tier => `
  <div style="margin-bottom:20px;border:1px solid var(--rule);border-radius:4px;overflow:hidden">
    <div style="background:var(--paper-2);padding:10px 14px;font-weight:600;font-size:13px;border-bottom:1px solid var(--rule)">${esc(tier.tier)}</div>
    <div style="padding:12px 14px">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px">
        <div class="info-box" style="text-align:center"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:2px">Stated SLA</div><div style="font-size:18px;font-weight:700;color:var(--navy)">${esc(tier.statedSlaDays)}d</div></div>
        <div class="info-box" style="text-align:center"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:2px">Computed SLA</div><div style="font-size:18px;font-weight:700;color:var(--navy)">${esc(tier.computedSlaDays)}d</div></div>
        <div class="info-box" style="text-align:center;border-left-color:${tier.variance === 0 ? 'var(--s0)' : 'var(--s2)'}"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:2px">Variance</div><div style="font-size:18px;font-weight:700;color:${tier.variance === 0 ? 'var(--s0)' : 'var(--s2)'}">${tier.variance >= 0 ? '+' : ''}${esc(tier.variance)}d</div></div>
        <div class="info-box"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:2px">Justification</div><div style="font-size:11px">${esc(tier.varianceJustification) || '—'}</div></div>
      </div>
      <table><thead><tr><th>OLA Component</th><th>Days</th><th>Mode</th></tr></thead>
      <tbody>${tier.olaBreakdown.map(o => `<tr><td>${esc(o.service)}</td><td style="font-family:monospace;font-weight:600">${esc(o.olaDays)}</td><td><span class="badge ${o.executionMode === 'Parallel' ? 'pass' : 'mat-candidate'}">${esc(o.executionMode)}</span></td></tr>`).join('')}</tbody></table>
    </div>
  </div>`).join('')}
</div>` : ''}

<div id="s20" class="section page-break">
  ${sectionHeader('20', 'Workflow Diagram')}
  <div style="width:100%;height:560px;border:1px solid var(--rule);background:#fafaf6;position:relative">
    <div id="diagram-cm"></div>
  </div>
  <div style="display:flex;gap:8px;margin-top:8px">
    <button class="bpmn-btn" onclick="downloadSvg()">↓ SVG</button>
    <button class="bpmn-btn" style="background:transparent;color:var(--navy);border:1.5px solid var(--navy)" onclick="downloadXml()">↓ BPMN XML</button>
  </div>
</div>

<div id="s21" class="section">
  ${sectionHeader('21', 'Subflow Alignment Summary')}
  <table><thead><tr><th>Module ID</th><th>Pattern</th><th>WCP Code</th><th>Deviation</th></tr></thead>
  <tbody>${manifest.stage2.subflowAlignment.map(s => `<tr><td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(s.moduleId)}</td><td>${esc(s.pattern)}</td><td style="font-family:monospace">${esc(s.wcpCode)}</td><td>${esc(s.deviation) || '<span style="color:var(--muted)">None</span>'}</td></tr>`).join('')}</tbody></table>
</div>

${manifest.stage2.patternDriftNotes && manifest.stage2.patternDriftNotes.length > 0 ? `
<div id="s22" class="section">
  ${sectionHeader('22', 'Pattern Drift Notes')}
  <table><thead><tr><th>Module ID</th><th>Standard Pattern</th><th>Deviation</th><th>Justification</th><th>Library Update?</th></tr></thead>
  <tbody>${manifest.stage2.patternDriftNotes.map(n => `<tr><td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(n.moduleId)}</td><td>${esc(n.standardPattern)}</td><td style="font-size:11px">${esc(n.deviation)}</td><td style="font-size:11px">${esc(n.justification)}</td><td style="text-align:center">${n.libraryUpdateRecommended ? '<span class="badge pass">Yes</span>' : '<span class="badge mat-deprecated">No</span>'}</td></tr>`).join('')}</tbody></table>
</div>` : ''}

<!-- ════════════════ STAGE 3 ════════════════ -->
<div class="stage-divider s3">▸ Stage 3 — Build-Ready Requirements · §23–27</div>

<div id="s23" class="section">
  ${sectionHeader('23', 'Build-Ready Handoff')}
  <div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§23.1 Data Contracts</div>
  ${bh.dataContracts.map(dc => `<div style="margin-bottom:14px;padding:14px;border:1px solid var(--rule);border-radius:4px"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><strong>${esc(dc.name)}</strong><span class="badge ${dc.direction === 'Inbound' ? 'pass' : 'manual'}">${esc(dc.direction)}</span></div><div class="kv-grid"><div class="k">Schema</div><div class="v" style="font-family:monospace;font-size:11px;white-space:pre-wrap">${esc(dc.schemaDescription)}</div><div class="k">Mandatory</div><div class="v"><div class="tag-list">${dc.mandatoryFields.map(f => `<span class="tag">${esc(f)}</span>`).join('')}</div></div><div class="k">Optional</div><div class="v"><div class="tag-list">${dc.optionalFields.map(f => `<span class="tag" style="opacity:.7">${esc(f)}</span>`).join('')}</div></div><div class="k">Versioning</div><div class="v">${esc(dc.versioningStrategy)}</div>${dc.schemaReference ? `<div class="k">Schema Reference</div><div class="v" style="font-family:monospace;font-size:11px">${esc(dc.schemaReference)}</div>` : ''}${dc.notes ? `<div class="k">Notes</div><div class="v" style="font-size:11px">${esc(dc.notes)}</div>` : ''}</div></div>`).join('')}

  <div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:18px 0 8px">§23.2 Integration Points</div>
  <table><thead><tr><th>External System</th><th>Direction</th><th>Protocol</th><th>Frequency</th><th>Authentication</th><th>Fallback Behaviour</th><th>Rate Limits</th><th>SLA Dependency</th></tr></thead>
  <tbody>${bh.integrationPoints.map(ip => `<tr><td><strong>${esc(ip.system)}</strong></td><td><span class="badge ${ip.direction === 'Inbound' ? 'pass' : ip.direction === 'Outbound' ? 'manual' : 'assisted'}">${esc(ip.direction)}</span></td><td style="font-family:monospace">${esc(ip.protocol)}</td><td>${esc(ip.frequency)}</td><td style="font-family:monospace;font-size:11px">${esc(ip.authentication)}</td><td style="font-size:11px">${esc(ip.fallbackBehavior)}</td><td style="font-size:11px">${esc(ip.rateLimits)}</td><td style="font-size:11px">${esc(ip.slaDependency)}</td></tr>`).join('')}</tbody></table>

  <div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:18px 0 8px">§23.3 Automation Candidates (Confirmed)</div>
  <table><thead><tr><th>Task ID</th><th>Mode</th><th>Approach</th><th>Prerequisites</th><th>Phase</th><th>Estimated Effort</th></tr></thead>
  <tbody>${bh.automationCandidates.map(ac => `<tr><td style="font-family:monospace;font-weight:600">${esc(ac.taskId)}</td><td>${esc(ac.automationMode)}</td><td>${esc(ac.buildApproach)}</td><td><ul style="margin:0;padding-left:14px">${ac.prerequisites.map(p => `<li style="font-size:11px">${esc(p)}</li>`).join('')}</ul></td><td><span class="badge ${ac.phase === 'Phase 1' ? 'pass' : 'mat-candidate'}">${esc(ac.phase)}</span></td><td style="font-size:11px">${esc(ac.estimatedEffort)}</td></tr>`).join('')}</tbody></table>
</div>

<div id="s24" class="section">
  ${sectionHeader('24', 'KPI Inheritance')}
  <table><thead><tr><th>KPI Name</th><th>Definition</th><th>Source Tasks</th><th>Parent KPI</th><th>Child KPI</th><th>Frequency</th><th>Baseline</th><th>Target</th></tr></thead>
  <tbody>${manifest.stage3.kpiInheritance.map(k => `<tr><td><strong>${esc(k.name)}</strong></td><td style="font-size:11px">${esc(k.definition)}</td><td><div class="tag-list">${k.sourceTasks.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></td><td style="font-size:11px">${esc(k.parentKpi)}</td><td style="font-size:11px">${esc(k.childKpi)}</td><td><span class="badge mat-candidate">${esc(k.frequency)}</span></td><td style="font-size:11px">${esc(k.baseline)}</td><td style="font-weight:600;color:var(--navy)">${esc(k.target)}</td></tr>`).join('')}</tbody></table>
</div>

<div id="s25" class="section">
  ${sectionHeader('25', 'Operating Model')}
  <div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§25.1 RACI</div>
  <table><thead><tr><th>Activity</th><th>R</th><th>A</th><th>C</th><th>I</th></tr></thead>
  <tbody>${manifest.stage3.operatingModel.raci.map(r => `<tr><td><strong>${esc(r.activity)}</strong></td><td>${esc(r.responsible)}</td><td>${esc(r.accountable)}</td><td>${esc(r.consulted)}</td><td>${esc(r.informed)}</td></tr>`).join('')}</tbody></table>
  <div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:16px 0 8px">§25.2 Governance Cadence</div>
  <table><thead><tr><th>Forum</th><th>Frequency</th><th>Attendees</th><th>Purpose</th></tr></thead>
  <tbody>${manifest.stage3.operatingModel.cadence.map(c => `<tr><td><strong>${esc(c.forum)}</strong></td><td><span class="badge mat-candidate">${esc(c.frequency)}</span></td><td>${esc(c.attendees)}</td><td>${esc(c.purpose)}</td></tr>`).join('')}</tbody></table>
</div>

<div id="s26" class="section">
  ${sectionHeader('26', 'Acceptance Criteria & Test Approach')}
  <table><thead><tr><th>#</th><th>Criterion</th><th>Test Approach</th><th>Pass Threshold</th><th>Owner</th></tr></thead>
  <tbody>${manifest.stage3.acceptanceCriteria.map((ac, i) => `<tr><td style="font-family:monospace;font-weight:600;color:var(--navy);text-align:center">${i + 1}</td><td>${esc(ac.criterion)}</td><td>${esc(ac.testApproach)}</td><td style="font-weight:600;color:var(--s0)">${esc(ac.passThreshold)}</td><td>${esc(ac.testOwner)}</td></tr>`).join('')}</tbody></table>
</div>

<div id="s27" class="section">
  ${sectionHeader('27', 'Risks & Open Questions')}
  <table><thead><tr><th>Item</th><th>Type</th><th>Owner</th><th>Resolution Date</th><th>Notes</th></tr></thead>
  <tbody>${manifest.stage3.risksOpenQuestions.map(r => `<tr><td>${esc(r.item)}</td><td>${riskBadge(r.type)}</td><td>${esc(r.owner)}</td><td style="font-family:monospace">${esc(r.resolutionDate)}</td><td style="font-size:11px">${esc(r.notes)}</td></tr>`).join('')}</tbody></table>
</div>

</div><!-- end main-content -->

<div class="toolbar">
  <button class="btn" onclick="window.print()">↓ Export Complete Manifest PDF</button>
</div>

<style>
.bpmn-btn { font-family:"JetBrains Mono",monospace; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.08em; padding:6px 14px; background:var(--navy); color:#fff; border:none; cursor:pointer; }
#diagram-cm { width:100%; height:100%; }
</style>

<script src="https://unpkg.com/bpmn-js@18.16.0/dist/bpmn-navigated-viewer.production.min.js"></script>
<script>
const xml = \`${escaped}\`;
let viewer;
(async () => {
  viewer = new BpmnJS({ container: '#diagram-cm' });
  try {
    await viewer.importXML(xml);
    viewer.get('canvas').zoom('fit-viewport', 'auto');
  } catch(e) {
    document.getElementById('diagram-cm').innerHTML = '<div style="padding:24px;color:#c62828;font-family:monospace">BPMN error: ' + e.message + '</div>';
  }
})();
async function downloadSvg() {
  const { svg } = await viewer.saveSVG();
  const a = document.createElement('a');
  a.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  a.download = '${esc(si.serviceCode)}-workflow.svg';
  a.click();
}
function downloadXml() {
  const a = document.createElement('a');
  a.href = 'data:application/xml;charset=utf-8,' + encodeURIComponent(xml);
  a.download = '${esc(si.serviceCode)}-workflow.bpmn';
  a.click();
}
// smooth scroll for nav
document.querySelectorAll('.nav-link').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    const id = el.getAttribute('href').slice(1);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
</script>
</body>
</html>`;
}

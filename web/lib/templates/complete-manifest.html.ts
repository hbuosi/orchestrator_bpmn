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
  <a class="nav-link s2" href="#s20">§20 Workflow / BPMN</a>
  <a class="nav-link s2" href="#s21">§21 Subflow Alignment</a>
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
    <div class="k">Service Code</div><div class="v">${esc(si.serviceCode)}</div>
    <div class="k">Name (EN)</div><div class="v">${esc(si.nameEn)}</div>
    <div class="k">Name (AR)</div><div class="v" style="font-family:serif;direction:rtl;text-align:right">${esc(si.nameAr)}</div>
    <div class="k">Category</div><div class="v">${esc(si.category)}</div>
    <div class="k">Owning Entity</div><div class="v">${esc(si.owningEntity)}</div>
    <div class="k">Trigger</div><div class="v">${esc(si.trigger)}</div>
    <div class="k">Outcome</div><div class="v">${esc(si.outcome)}</div>
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
  <div class="kv-grid">
    <div class="k">Journey Phase</div><div class="v">${esc(manifest.stage0.customerJourneyContext.journeyPhase)}</div>
    ${manifest.stage0.customerJourneyContext.precedingService ? `<div class="k">Preceding</div><div class="v">${esc(manifest.stage0.customerJourneyContext.precedingService)}</div>` : ''}
    ${manifest.stage0.customerJourneyContext.followingService ? `<div class="k">Following</div><div class="v">${esc(manifest.stage0.customerJourneyContext.followingService)}</div>` : ''}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px">
    <div><div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px">Touchpoints</div><ul>${manifest.stage0.customerJourneyContext.touchpoints.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
    <div><div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px">Pain Points</div><ul>${manifest.stage0.customerJourneyContext.painPoints.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>
  </div>
</div>

<div id="s3" class="section">
  ${sectionHeader('3', 'Capability Reuse Search')}
  <table><thead><tr><th>Search Term</th><th>Match?</th><th>Match Name</th><th>Decision</th><th>Rationale</th></tr></thead>
  <tbody>${manifest.stage0.capabilityReuseSearch.map(r => `<tr><td>${esc(r.searchTerm)}</td><td>${r.matchFound ? '✓' : '✗'}</td><td>${esc(r.matchName)}</td><td><span class="badge ${r.decision === 'new' ? 'mat-candidate' : 'pass'}">${esc(r.decision)}</span></td><td>${esc(r.rationale)}</td></tr>`).join('')}</tbody></table>
</div>

<div id="s4" class="section">
  ${sectionHeader('4', 'Demand & Capacity Profile')}
  <div class="kv-grid">
    <div class="k">Annual Volume</div><div class="v">${esc(manifest.stage0.demandProfile.annualVolume.toLocaleString())}</div>
    <div class="k">Volume Basis</div><div class="v">${esc(manifest.stage0.demandProfile.volumeBasis)}</div>
    <div class="k">Peak Periods</div><div class="v">${manifest.stage0.demandProfile.peakPeriods.map(p => `<span class="tag">${esc(p)}</span>`).join(' ')}</div>
    <div class="k">Channels</div><div class="v"><div class="tag-list">${manifest.stage0.demandProfile.channels.map(c => `<span class="tag">${esc(c)}</span>`).join('')}</div></div>
    <div class="k">Capacity</div><div class="v">${esc(manifest.stage0.demandProfile.capacityBaseline)}</div>
  </div>
</div>

<div id="s6" class="section">
  ${sectionHeader('6', 'Data Inventory')}
  <table><thead><tr><th>Data Element</th><th>C</th><th>R</th><th>U</th><th>D</th><th>Classification</th><th>Retention</th></tr></thead>
  <tbody>${manifest.stage0.dataInventory.map(d => `<tr><td>${esc(d.dataElement)}</td><td style="text-align:center">${bool(d.creates)}</td><td style="text-align:center">${bool(d.reads)}</td><td style="text-align:center">${bool(d.updates)}</td><td style="text-align:center">${bool(d.deletes)}</td><td>${esc(d.classification)}</td><td style="font-family:monospace">${d.retentionDays != null ? esc(d.retentionDays) + 'd' : '—'}</td></tr>`).join('')}</tbody></table>
</div>

<div id="s7" class="section">
  ${sectionHeader('7', 'Stakeholder & Persona Map')}
  <table><thead><tr><th>Role</th><th>Type</th><th>Responsibilities</th><th>Organization</th></tr></thead>
  <tbody>${manifest.stage0.stakeholderMap.map(s => `<tr><td><strong>${esc(s.role)}</strong></td><td><span class="badge ${s.type === 'approver' ? 'pass' : 'mat-candidate'}">${esc(s.type)}</span></td><td><ul>${s.responsibilities.map(r => `<li>${esc(r)}</li>`).join('')}</ul></td><td>${esc(s.organization)}</td></tr>`).join('')}</tbody></table>
</div>

<!-- ════════════════ STAGE 1 ════════════════ -->
<div class="stage-divider s1">▸ Stage 1 — Service Design · §8–13</div>

<div id="s8" class="section">
  ${sectionHeader('8', 'Decomposition Decision')}
  <div style="margin-bottom:16px">Archetype: <span class="badge arch-${dd.archetype === 'Capability' ? 'cap' : dd.archetype === 'Composite' ? 'comp' : 'orch'}" style="font-size:13px;padding:5px 14px">${esc(dd.archetype)}</span></div>
  <table><thead><tr><th>Smell Test</th><th>Result</th><th>Notes</th></tr></thead>
  <tbody>${dd.smellTests.map(t => `<tr><td>${esc(t.test)}</td><td><span class="badge ${t.result}">${esc(t.result.toUpperCase())}</span></td><td>${esc(t.notes)}</td></tr>`).join('')}</tbody></table>
  <div class="info-box" style="margin-top:12px">${esc(dd.rationale)}</div>
</div>

<div id="s9" class="section">
  ${sectionHeader('9', 'Service Boundary & Interfaces')}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
    <div><div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">Inputs</div>
    <table><thead><tr><th>Name</th><th>Format</th><th>Source</th></tr></thead><tbody>${manifest.stage1.serviceBoundary.inputs.map(i => `<tr><td>${esc(i.name)}</td><td>${esc(i.format)}</td><td>${esc(i.source)}</td></tr>`).join('')}</tbody></table></div>
    <div><div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">Outputs</div>
    <table><thead><tr><th>Name</th><th>Format</th><th>Destination</th></tr></thead><tbody>${manifest.stage1.serviceBoundary.outputs.map(o => `<tr><td>${esc(o.name)}</td><td>${esc(o.format)}</td><td>${esc(o.destination)}</td></tr>`).join('')}</tbody></table></div>
  </div>
  ${manifest.stage1.serviceBoundary.calledServices.length > 0 ? `<div style="margin-top:14px"><table><thead><tr><th>Called Service</th><th>Cascade</th><th>OLA</th></tr></thead><tbody>${manifest.stage1.serviceBoundary.calledServices.map(s => `<tr><td>${esc(s.service)}</td><td>${esc(s.cascadePattern)}</td><td style="font-family:monospace">${esc(s.ola)}</td></tr>`).join('')}</tbody></table></div>` : ''}
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
  <table><thead><tr><th>OLA Component</th><th>Days</th><th>Mode</th></tr></thead>
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
  <table><thead><tr><th>ID</th><th>Module</th><th>Task</th><th>Mode</th><th>OLA</th><th>Capacity</th><th>Exception Path</th><th>Auto?</th></tr></thead>
  <tbody>${manifest.stage2.taskRegister.map(t => `<tr><td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(t.taskId)}</td><td style="font-family:monospace;font-size:11px;color:var(--muted)">${esc(t.moduleId)}</td><td><strong>${esc(t.name)}</strong><br><span style="font-size:11px;color:var(--muted)">${esc(t.description)}</span></td><td>${digitizationBadge(t.digitizationMode)}</td><td style="font-family:monospace">${esc(t.olaCompact)}</td><td style="font-size:11px">${esc(t.capacityAssumption)}</td><td style="font-size:11px">${esc(t.exceptionPath)}</td><td style="text-align:center">${bool(t.automationCandidate)}</td></tr>`).join('')}</tbody></table>
</div>

${manifest.stage2.loopGovernance.length > 0 ? `
<div id="s16" class="section">
  ${sectionHeader('16', 'Loop Governance')}
  <table><thead><tr><th>Loop ID</th><th>Type</th><th>Re-entry</th><th>Max Cycles</th><th>Timeout</th><th>Clock</th><th>Escalation</th></tr></thead>
  <tbody>${manifest.stage2.loopGovernance.map(l => `<tr><td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(l.loopId)}</td><td>${esc(l.type)}</td><td style="font-family:monospace">${esc(l.reentryTaskId)}</td><td style="text-align:center;font-weight:700">${esc(l.maxCycles)}</td><td>${esc(l.timeout)}</td><td><span class="badge mat-candidate">${esc(l.clockPolicy)}</span></td><td>${esc(l.escalationPath)}</td></tr>`).join('')}</tbody></table>
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

<!-- ════════════════ STAGE 3 ════════════════ -->
<div class="stage-divider s3">▸ Stage 3 — Build-Ready Requirements · §23–27</div>

<div id="s23" class="section">
  ${sectionHeader('23', 'Build-Ready Handoff')}
  <div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§23.1 Data Contracts</div>
  ${bh.dataContracts.map(dc => `<div style="margin-bottom:14px;padding:14px;border:1px solid var(--rule);border-radius:4px"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><strong>${esc(dc.name)}</strong><span class="badge ${dc.direction === 'Inbound' ? 'pass' : 'manual'}">${esc(dc.direction)}</span></div><div class="kv-grid"><div class="k">Schema</div><div class="v" style="font-family:monospace;font-size:11px;white-space:pre-wrap">${esc(dc.schemaDescription)}</div><div class="k">Mandatory</div><div class="v"><div class="tag-list">${dc.mandatoryFields.map(f => `<span class="tag">${esc(f)}</span>`).join('')}</div></div><div class="k">Optional</div><div class="v"><div class="tag-list">${dc.optionalFields.map(f => `<span class="tag" style="opacity:.7">${esc(f)}</span>`).join('')}</div></div></div></div>`).join('')}

  <div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:18px 0 8px">§23.2 Integration Points</div>
  <table><thead><tr><th>System</th><th>Direction</th><th>Protocol</th><th>Auth</th><th>Fallback</th></tr></thead>
  <tbody>${bh.integrationPoints.map(ip => `<tr><td><strong>${esc(ip.system)}</strong></td><td><span class="badge ${ip.direction === 'Inbound' ? 'pass' : 'manual'}">${esc(ip.direction)}</span></td><td style="font-family:monospace">${esc(ip.protocol)}</td><td style="font-family:monospace;font-size:11px">${esc(ip.authentication)}</td><td style="font-size:11px">${esc(ip.fallbackBehavior)}</td></tr>`).join('')}</tbody></table>

  <div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:18px 0 8px">§23.3 Automation Candidates</div>
  <table><thead><tr><th>Task ID</th><th>Mode</th><th>Approach</th><th>Phase</th></tr></thead>
  <tbody>${bh.automationCandidates.map(ac => `<tr><td style="font-family:monospace;font-weight:600">${esc(ac.taskId)}</td><td>${esc(ac.automationMode)}</td><td>${esc(ac.buildApproach)}</td><td><span class="badge ${ac.phase === 'Phase 1' ? 'pass' : 'mat-candidate'}">${esc(ac.phase)}</span></td></tr>`).join('')}</tbody></table>
</div>

<div id="s24" class="section">
  ${sectionHeader('24', 'KPI Inheritance')}
  <table><thead><tr><th>KPI</th><th>Definition</th><th>Source Tasks</th><th>Parent KPI</th><th>Frequency</th><th>Target</th></tr></thead>
  <tbody>${manifest.stage3.kpiInheritance.map(k => `<tr><td><strong>${esc(k.name)}</strong></td><td style="font-size:11px">${esc(k.definition)}</td><td><div class="tag-list">${k.sourceTasks.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></td><td style="font-size:11px">${esc(k.parentKpi)}</td><td><span class="badge mat-candidate">${esc(k.frequency)}</span></td><td style="font-weight:600;color:var(--navy)">${esc(k.target)}</td></tr>`).join('')}</tbody></table>
</div>

<div id="s25" class="section">
  ${sectionHeader('25', 'Operating Model')}
  <div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">§25.1 RACI</div>
  <table><thead><tr><th>Activity</th><th>R</th><th>A</th><th>C</th><th>I</th></tr></thead>
  <tbody>${manifest.stage3.operatingModel.raci.map(r => `<tr><td><strong>${esc(r.activity)}</strong></td><td>${esc(r.responsible)}</td><td>${esc(r.accountable)}</td><td>${esc(r.consulted)}</td><td>${esc(r.informed)}</td></tr>`).join('')}</tbody></table>
  <div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:16px 0 8px">§25.2 Cadence</div>
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

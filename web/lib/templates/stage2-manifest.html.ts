import type { Stage2 } from '../schemas/manifest.schema';
import { esc, bool, MANIFEST_CSS, docHeader, sectionHeader, maturityBadge, digitizationBadge } from './manifest-shared';

function escBpmn(xml: string): string {
  return xml.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

export function stage2ManifestTemplate(data: Stage2, bpmnXml: string, serviceCode: string): string {
  const escaped = escBpmn(bpmnXml);

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
    <thead><tr><th>ID</th><th>Module Name</th><th>Description</th><th>OLA</th><th>Aligned Subflow</th><th>Maturity</th></tr></thead>
    <tbody>
      ${data.moduleRegister.map(m => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(m.moduleId)}</td>
        <td><strong>${esc(m.name)}</strong></td>
        <td>${esc(m.description)}</td>
        <td style="font-family:monospace">${esc(m.ola)}</td>
        <td>${esc(m.alignedSubflow)}</td>
        <td>${maturityBadge(m.subflowMaturity)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- §15 Task Register -->
<div class="section page-break">
  ${sectionHeader('15', 'Task Register')}
  <table>
    <thead><tr><th>Task ID</th><th>Module</th><th>Task Name</th><th>Type</th><th>Mode</th><th>OLA</th><th>Capacity</th><th>Exception Path</th><th>Auto?</th></tr></thead>
    <tbody>
      ${data.taskRegister.map(t => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(t.taskId)}</td>
        <td style="font-family:monospace;font-size:11px;color:var(--muted)">${esc(t.moduleId)}</td>
        <td><strong>${esc(t.name)}</strong><br><span style="font-size:11px;color:var(--muted)">${esc(t.description)}</span></td>
        <td style="font-family:monospace;font-size:11px">${esc(t.taskTypeCode)}</td>
        <td>${digitizationBadge(t.digitizationMode)}</td>
        <td style="font-family:monospace">${esc(t.olaCompact)}</td>
        <td style="font-size:11px">${esc(t.capacityAssumption)}</td>
        <td style="font-size:11px">${esc(t.exceptionPath)}</td>
        <td style="text-align:center">${bool(t.automationCandidate)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- §16 Loop Governance -->
${data.loopGovernance.length > 0 ? `
<div class="section">
  ${sectionHeader('16', 'Loop Governance')}
  <table>
    <thead><tr><th>Loop ID</th><th>Type</th><th>Re-entry Task</th><th>Max Cycles</th><th>Timeout</th><th>Clock Policy</th><th>Escalation Path</th></tr></thead>
    <tbody>
      ${data.loopGovernance.map(l => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(l.loopId)}</td>
        <td>${esc(l.type)}</td>
        <td style="font-family:monospace">${esc(l.reentryTaskId)}</td>
        <td style="text-align:center;font-weight:700">${esc(l.maxCycles)}</td>
        <td>${esc(l.timeout)}</td>
        <td><span class="badge mat-candidate">${esc(l.clockPolicy)}</span></td>
        <td>${esc(l.escalationPath)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>` : ''}

<!-- §20 Workflow Diagram (BPMN) -->
<div class="section page-break">
  ${sectionHeader('20', 'Workflow Diagram')}
  <div class="bpmn-wrap">
    <div id="diagram-s2"></div>
  </div>
  <div class="bpmn-btns">
    <button class="bpmn-btn" id="btn-pdf-bpmn" onclick="printBpmn()">↓ BPMN PDF</button>
    <button class="bpmn-btn outline" id="btn-svg" onclick="downloadSvg()">↓ SVG</button>
    <button class="bpmn-btn outline" id="btn-xml" onclick="downloadXml()">↓ BPMN XML</button>
  </div>
</div>

<!-- §21 Subflow Alignment Summary -->
<div class="section">
  ${sectionHeader('21', 'Subflow Alignment Summary')}
  <table>
    <thead><tr><th>Module ID</th><th>Aligned Pattern</th><th>WCP Code</th><th>Deviation Notes</th></tr></thead>
    <tbody>
      ${data.subflowAlignment.map(s => `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--navy)">${esc(s.moduleId)}</td>
        <td>${esc(s.pattern)}</td>
        <td style="font-family:monospace">${esc(s.wcpCode)}</td>
        <td>${esc(s.deviation) || '<span style="color:var(--muted)">None</span>'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<div class="toolbar">
  <button class="btn" onclick="window.print()">↓ Export Stage 2 PDF</button>
</div>

<script src="https://unpkg.com/bpmn-js@18.16.0/dist/bpmn-navigated-viewer.production.min.js"></script>
<script>
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
</script>
</body>
</html>`;
}

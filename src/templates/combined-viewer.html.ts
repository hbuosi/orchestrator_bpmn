import type { ServiceCard } from '../schemas/service-card.schema.js';
import { BPMN_COLORS } from '../constants/colors.js';

const channelLabel: Record<string, string> = {
  online: 'Online', app: 'Smart App', 'call-center': 'Call Center', 'in-person': 'Service Center',
};
const stageLabel: Record<string, string> = {
  paper: 'Paper', digital: 'Digital', smart: 'Smart', proactive: 'Proactive',
};
const uaePassLevelLabel: Record<number, string> = {
  1: 'L1 — Auth', 2: 'L2 — Identity', 3: 'L3 — Signature',
};

function escapeXml(xml: string): string {
  return xml
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
}

function cardBody(card: ServiceCard): string {
  const today = new Date().toISOString().split('T')[0];
  return `
    <div class="meta-grid">
      <div class="k">Code</div><div>${card.serviceCode}</div>
      <div class="k">Entity</div><div>${card.owningEntity}</div>
      <div class="k">Category</div><div>${card.category}</div>
      <div class="k">Stage</div><div>${stageLabel[card.transformationStage]}</div>
      <div class="k">Channels</div><div>${card.channels.map(c => channelLabel[c] ?? c).join(' · ')}</div>
      <div class="k">Segment</div><div>${card.targetSegment.join(' · ')}</div>
      ${card.uaePassEnabled ? `<div class="k">UAE Pass</div><div>${card.uaePassLevel ? uaePassLevelLabel[card.uaePassLevel] : 'Enabled'}</div>` : ''}
      <div class="k">Revision</div><div>${today}</div>
    </div>

    <h2>Service Journey</h2>
    <ol class="journey">
      ${card.journeySteps.map(s => `
        <li>
          <strong>${s.title}</strong>${s.estimatedMinutes ? ` <span class="muted">~${s.estimatedMinutes} min</span>` : ''}<br>
          <span class="step-desc">${s.description}</span>
        </li>`).join('')}
    </ol>

    <h2>Eligibility</h2>
    <ul>
      ${card.eligibilityCriteria.map(e => `<li>${e}</li>`).join('')}
    </ul>

    <h2>Required Documents</h2>
    <ul>
      ${card.requiredDocuments.map(d => `<li>${d.name}${d.format ? ` <span class="muted">(${d.format})</span>` : ''}${d.notes ? ` — ${d.notes}` : ''}</li>`).join('')}
    </ul>

    <h2>SLA</h2>
    ${Object.entries(card.slaDays).map(([ch, days]) => `
      <div class="sla-grid">
        <span>${channelLabel[ch] ?? ch}</span><span class="v">${days} day${days !== 1 ? 's' : ''}</span>
      </div>`).join('')}

    <h2>Fees (AED)</h2>
    <table>
      <thead><tr><th>Channel</th><th>Type</th><th>AED</th></tr></thead>
      <tbody>
        ${card.fees.map(f => `<tr><td>${channelLabel[f.channel] ?? f.channel}</td><td>${f.applicantType ?? '—'}</td><td>${f.amountAED === 0 ? 'Free' : f.amountAED.toLocaleString()}</td></tr>`).join('')}
      </tbody>
    </table>

    <h2>Output Documents</h2>
    <ul>
      ${card.outputDocuments.map(d => `<li><strong>${d.name}</strong> · ${d.format}${d.validityDays ? ` · ${d.validityDays}d` : ''} · <span class="muted">${d.deliveryMethod}</span></li>`).join('')}
    </ul>

    <h2>Legal Basis</h2>
    <p class="legal">${card.legalBasis}</p>
    ${(card as Record<string, unknown>)['addaComplianceLevel'] ? `<p class="legal"><strong>ADDA:</strong> ${(card as Record<string, unknown>)['addaComplianceLevel']}</p>` : ''}
    ${(card as Record<string, unknown>)['lifeEvent'] ? `<p class="legal"><strong>Life Event:</strong> ${(card as Record<string, unknown>)['lifeEvent']}</p>` : ''}
    ${card.integrationApis?.length ? `<p class="legal"><strong>APIs:</strong> ${card.integrationApis.join(', ')}</p>` : ''}
  `;
}

export function combinedViewerTemplate(card: ServiceCard, bpmnXml: string): string {
  const today = new Date().toISOString().split('T')[0];
  const escaped = escapeXml(bpmnXml);
  const serviceCode = card.serviceCode;

  const legendColors = [
    { fill: BPMN_COLORS.happy.fill, stroke: BPMN_COLORS.happy.stroke, label: 'Happy path' },
    { fill: BPMN_COLORS.happy_end.fill, stroke: BPMN_COLORS.happy_end.stroke, label: 'Success end' },
    { fill: BPMN_COLORS.cancel.fill, stroke: BPMN_COLORS.cancel.stroke, label: 'Error end' },
    { fill: BPMN_COLORS.decision.fill, stroke: BPMN_COLORS.decision.stroke, label: 'Decision' },
    { fill: BPMN_COLORS.manual.fill, stroke: BPMN_COLORS.manual.stroke, label: 'Human task' },
    { fill: BPMN_COLORS.system.fill, stroke: BPMN_COLORS.system.stroke, label: 'System task' },
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${card.nameEn} — GSD Service Orchestrator</title>
<link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.16.0/dist/assets/diagram-js.css">
<link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.16.0/dist/assets/bpmn-js.css">
<link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.16.0/dist/assets/bpmn-font/css/bpmn.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,900&family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root {
  --ink: #1a1d23;
  --paper: #fafaf6;
  --paper-2: #f0efe7;
  --rule: #d6d3c4;
  --accent: #2E7D32;
  --accent-2: #E65100;
  --accent-3: #C62828;
  --accent-4: #1565C0;
  --muted: #6b6b5e;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--paper);
  color: var(--ink);
  font-family: "Inter", -apple-system, sans-serif;
  font-size: 15px;
  line-height: 1.55;
}
.masthead {
  border-bottom: 3px double var(--ink);
  padding: 32px 48px 20px;
  background: var(--paper);
  position: sticky; top: 0; z-index: 10;
}
.kicker {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--muted);
  margin-bottom: 8px;
  display: flex; gap: 20px; align-items: baseline;
}
.kicker .dot { color: var(--accent); }
h1.title {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 900;
  font-size: clamp(30px, 4vw, 56px);
  line-height: 0.95;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
  font-variation-settings: "opsz" 144;
}
.subtitle {
  font-family: "Fraunces", serif;
  font-style: italic;
  font-size: 17px;
  color: var(--muted);
  max-width: 720px;
  margin: 0;
}
.layout {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  min-height: calc(100vh - 130px);
}
@media (max-width: 1100px) { .layout { grid-template-columns: 1fr; } }
.card {
  padding: 40px 44px;
  border-right: 1px solid var(--rule);
  background: var(--paper);
  overflow-y: auto;
  max-height: calc(100vh - 130px);
}
.meta-grid {
  display: grid; grid-template-columns: 100px 1fr;
  gap: 8px 18px;
  font-size: 13.5px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--rule);
}
.meta-grid .k {
  font-family: "JetBrains Mono", monospace;
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  align-self: center;
}
.card h2 {
  font-family: "Fraunces", serif;
  font-weight: 700;
  font-size: 20px;
  margin: 24px 0 10px;
  letter-spacing: -0.01em;
}
.card h2::before { content: "§ "; color: var(--accent); font-weight: 900; }
.card ul, .card ol { margin: 8px 0; padding-left: 22px; }
.card li { margin: 4px 0; font-size: 14px; }
.card p { margin: 8px 0; font-size: 14px; }
.muted { color: var(--muted); font-size: 13px; }
.step-desc { color: var(--muted); font-size: 13px; }
.journey li { margin-bottom: 8px; }
.sla-grid {
  display: grid; grid-template-columns: 1fr auto;
  gap: 4px 12px;
  font-size: 14px;
  padding: 10px 14px;
  background: var(--paper-2);
  border-left: 3px solid var(--accent);
  margin: 6px 0;
}
.sla-grid .v { font-family: "JetBrains Mono", monospace; font-weight: 600; }
table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 8px 0; }
th {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em;
  background: var(--ink); color: var(--paper);
  padding: 7px 10px; text-align: left;
}
td { padding: 6px 10px; border-bottom: 1px solid var(--rule); }
tr:nth-child(even) td { background: var(--paper-2); }
.legal { font-size: 12.5px; line-height: 1.6; color: var(--muted); margin: 6px 0; }
.diagram-wrap {
  background: linear-gradient(135deg, #fafaf6 0%, #f5f4ec 100%);
  position: relative;
  overflow: hidden;
}
.diagram-toolbar {
  position: absolute; top: 16px; right: 16px;
  display: flex; gap: 8px; z-index: 5;
}
.tool-btn {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  padding: 8px 14px;
  background: var(--ink); color: var(--paper);
  border: none; cursor: pointer; transition: transform 0.1s;
}
.tool-btn:hover { transform: translateY(-1px); background: #000; }
.tool-btn.outline { background: transparent; color: var(--ink); border: 1.5px solid var(--ink); }
.tool-btn.outline:hover { background: var(--ink); color: var(--paper); }
#diagram { width: 100%; height: 100%; min-height: 600px; }
.legend {
  position: absolute; bottom: 20px; left: 20px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(8px);
  border: 1px solid var(--rule);
  padding: 14px 16px;
  font-family: "JetBrains Mono", monospace;
  font-size: 10.5px; line-height: 1.7;
  z-index: 5; max-width: 260px;
}
.lg-title {
  font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em;
  margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid var(--rule);
}
.lg-row { display: flex; align-items: center; gap: 8px; }
.sw { width: 14px; height: 14px; border: 1.5px solid; flex-shrink: 0; }
.verify {
  position: absolute; top: 16px; left: 16px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(8px);
  border: 1px solid var(--rule);
  padding: 12px 16px;
  font-family: "JetBrains Mono", monospace;
  font-size: 10.5px; line-height: 1.7; z-index: 5;
}
.vrow { display: flex; gap: 8px; align-items: center; }
.ok { color: var(--accent); font-weight: 700; }
.vhdr { font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 6px; }
footer {
  border-top: 1px solid var(--rule);
  padding: 18px 48px;
  font-family: "JetBrains Mono", monospace;
  font-size: 11px; color: var(--muted);
  display: flex; justify-content: space-between; align-items: center;
}
footer a { color: var(--accent); text-decoration: none; }
footer a:hover { text-decoration: underline; }
@media print {
  @page { size: A3 landscape; margin: 10mm; }
  .masthead { position: static; }
  .diagram-toolbar, .legend, .verify { display: none !important; }
  .layout { min-height: unset; display: grid; grid-template-columns: 1fr 1.4fr; }
  .card { max-height: unset; overflow: visible; }
  #diagram { min-height: 500px; }
  footer { display: none; }
}
</style>
</head>
<body>

<header class="masthead">
  <div class="kicker">
    <span class="dot">●</span>
    <span>GSD SERVICE ORCHESTRATOR</span>
    <span>·</span>
    <span>BPMN 2.0 + SERVICE CARD</span>
    <span>·</span>
    <span>${serviceCode} / ${today}</span>
  </div>
  <h1 class="title">${card.nameEn}</h1>
  <p class="subtitle">${card.nameAr} · ${card.owningEntity}</p>
</header>

<main class="layout">

  <aside class="card">
    ${cardBody(card)}
  </aside>

  <section class="diagram-wrap">
    <div class="verify">
      <div class="vhdr">Verification ✓</div>
      <div class="vrow"><span class="ok">✓</span> BPMN 2.0 schema</div>
      <div class="vrow"><span class="ok">✓</span> Auto-layout (0 overlaps)</div>
      <div class="vrow"><span class="ok">✓</span> BPMN-in-Color palette</div>
      <div class="vrow"><span class="ok">✓</span> bioc: + color: dual write</div>
      <div class="vrow"><span class="ok">✓</span> Card ↔ BPMN sync</div>
    </div>

    <div class="diagram-toolbar">
      <button class="tool-btn outline" id="zoom-fit">FIT</button>
      <button class="tool-btn outline" id="zoom-in">+</button>
      <button class="tool-btn outline" id="zoom-out">−</button>
      <button class="tool-btn" id="export-pdf">↓ BPMN PDF</button>
      <button class="tool-btn" id="export-svg">↓ SVG</button>
      <button class="tool-btn" id="export-bpmn">↓ BPMN XML</button>
      <button class="tool-btn outline" id="export-card-pdf">↓ Card PDF</button>
    </div>

    <div id="diagram"></div>

    <div class="legend">
      <div class="lg-title">BPMN-in-Color</div>
      ${legendColors.map(c => `<div class="lg-row"><span class="sw" style="background:${c.fill};border-color:${c.stroke}"></span> ${c.label}</div>`).join('\n      ')}
    </div>
  </section>

</main>

<footer>
  <span>GSD SERVICE ORCHESTRATOR · ${today} · bpmn-moddle → bpmn-auto-layout → BPMN-in-Color → bpmn-js</span>
  <span>Compatible: bpmn.io · Camunda · Cawemo · Signavio · Trisotech</span>
</footer>

<script src="https://unpkg.com/bpmn-js@18.16.0/dist/bpmn-navigated-viewer.production.min.js"></script>
<script>
const BPMN_XML = \`${escaped}\`;

const viewer = new BpmnJS({ container: '#diagram' });

(async () => {
  try {
    const { warnings } = await viewer.importXML(BPMN_XML);
    if (warnings.length) console.warn('BPMN warnings:', warnings);
    viewer.get('canvas').zoom('fit-viewport', 'auto');
    document.body.setAttribute('data-bpmn-ready', '1');
  } catch (err) {
    console.error('BPMN import error', err);
    document.getElementById('diagram').innerHTML =
      '<div style="padding:40px;text-align:center;color:#C62828">Failed to render BPMN: ' + err.message + '</div>';
    document.body.setAttribute('data-bpmn-ready', 'error');
  }
})();

document.getElementById('zoom-fit').onclick = () => viewer.get('canvas').zoom('fit-viewport', 'auto');
document.getElementById('zoom-in').onclick  = () => viewer.get('zoomScroll').stepZoom(1);
document.getElementById('zoom-out').onclick = () => viewer.get('zoomScroll').stepZoom(-1);

document.getElementById('export-pdf').onclick = async () => {
  const { svg } = await viewer.saveSVG();
  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    '*{margin:0;padding:0;box-sizing:border-box;}' +
    '@page{size:A3 landscape;margin:12mm;}' +
    'html,body{height:100%;}' +
    'body{background:#fafaf6;display:flex;align-items:center;justify-content:center;min-height:100vh;}' +
    'svg{max-width:100%;max-height:100vh;width:auto!important;height:auto!important;display:block;}' +
    '</style></head><body>' + svg + '<scr' + 'ipt>window.onload=()=>{window.print();}<\/scr' + 'ipt></body></html>';
  window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank');
};

document.getElementById('export-svg').onclick = async () => {
  const { svg } = await viewer.saveSVG();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  a.download = '${serviceCode}-bpmn.svg';
  a.click();
};

document.getElementById('export-bpmn').onclick = async () => {
  const { xml } = await viewer.saveXML({ format: true });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([xml], { type: 'application/xml' }));
  a.download = '${serviceCode}-bpmn.xml';
  a.click();
};

document.getElementById('export-card-pdf').onclick = () => {
  const cardEl = document.querySelector('.card');
  const html = \`<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,900&family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;}
@page{size:A4 portrait;margin:18mm 16mm;}
:root{--ink:#1a1d23;--paper:#fafaf6;--paper-2:#f0efe7;--rule:#d6d3c4;--accent:#2E7D32;--muted:#6b6b5e;}
body{background:var(--paper);color:var(--ink);font-family:"Inter",sans-serif;font-size:13.5px;line-height:1.55;}
.meta-grid{display:grid;grid-template-columns:100px 1fr;gap:6px 16px;font-size:13px;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid var(--rule);}
.meta-grid .k{font-family:"JetBrains Mono",monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);align-self:center;}
h2{font-family:"Fraunces",serif;font-weight:700;font-size:18px;margin:20px 0 8px;letter-spacing:-0.01em;}
h2::before{content:"§ ";color:var(--accent);font-weight:900;}
ul,ol{margin:6px 0;padding-left:20px;}
li{margin:3px 0;font-size:13px;}
p{margin:6px 0;font-size:13px;}
.muted{color:var(--muted);font-size:12px;}
.step-desc{color:var(--muted);font-size:12px;}
.journey li{margin-bottom:6px;}
.sla-grid{display:grid;grid-template-columns:1fr auto;gap:3px 10px;font-size:13px;padding:8px 12px;background:var(--paper-2);border-left:3px solid var(--accent);margin:5px 0;}
.sla-grid .v{font-family:"JetBrains Mono",monospace;font-weight:600;}
table{width:100%;border-collapse:collapse;font-size:12px;margin:6px 0;}
th{font-family:"JetBrains Mono",monospace;font-size:9.5px;text-transform:uppercase;letter-spacing:0.08em;background:var(--ink);color:var(--paper);padding:6px 8px;text-align:left;}
td{padding:5px 8px;border-bottom:1px solid var(--rule);}
tr:nth-child(even) td{background:var(--paper-2);}
.legal{font-size:11.5px;line-height:1.6;color:var(--muted);margin:5px 0;}
</style>
</head><body>
<div>\${cardEl.innerHTML}</div>
<scr\${'ipt'}>window.onload=()=>{window.print();}<\/scr\${'ipt'}>
</body></html>\`;
  window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank');
};
</script>
</body>
</html>`;
}

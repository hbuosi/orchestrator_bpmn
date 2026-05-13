interface ViewerOptions {
  hiddenForExport?: boolean;
  title?: string;
  serviceCode?: string;
}

export function bpmnViewerTemplate(bpmnXml: string, opts: ViewerOptions = {}): string {
  const escaped = bpmnXml
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  const title = opts.title ?? 'BPMN Diagram';
  const code = opts.serviceCode ?? 'bpmn';

  if (opts.hiddenForExport) {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.16.0/dist/assets/diagram-js.css">
<link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.16.0/dist/assets/bpmn-js.css">
<link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.16.0/dist/assets/bpmn-font/css/bpmn.css">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:100%; height:100%; }
#canvas { width:100%; height:100vh; }
</style>
</head><body>
<div id="canvas"></div>
<script src="https://unpkg.com/bpmn-js@18.16.0/dist/bpmn-navigated-viewer.production.min.js"></script>
<script>
const viewer = new BpmnJS({ container: '#canvas' });
viewer.importXML(\`${escaped}\`)
  .then(() => {
    viewer.get('canvas').zoom('fit-viewport', 'auto');
    document.body.setAttribute('data-bpmn-ready', '1');
  })
  .catch(err => {
    document.getElementById('canvas').innerHTML =
      '<div style="padding:20px;color:#C62828">Render error: ' + err.message + '</div>';
    document.body.setAttribute('data-bpmn-ready', 'error');
  });
</script>
</body></html>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — BPMN</title>
<link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.16.0/dist/assets/diagram-js.css">
<link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.16.0/dist/assets/bpmn-js.css">
<link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.16.0/dist/assets/bpmn-font/css/bpmn.css">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
:root { --ink: #1a1d23; --paper: #fafaf6; --rule: #d6d3c4; --accent: #2E7D32; --muted: #6b6b5e; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100%; height: 100%; background: var(--paper); }
#diagram { width: 100%; height: calc(100vh - 52px); }
.toolbar {
  height: 52px; padding: 0 20px;
  background: var(--paper); border-bottom: 1px solid var(--rule);
  display: flex; align-items: center; gap: 10px;
}
.title {
  font-family: "Inter", sans-serif; font-size: 13px; font-weight: 600;
  color: var(--ink); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.btn {
  font-family: "JetBrains Mono", monospace; font-size: 10px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  padding: 6px 12px; border: 1.5px solid var(--ink);
  background: transparent; color: var(--ink); cursor: pointer;
}
.btn:hover { background: var(--ink); color: var(--paper); }
.btn.solid { background: var(--ink); color: var(--paper); }
.btn.solid:hover { background: #000; }
@media print {
  @page { size: A3 landscape; margin: 10mm; }
  .toolbar { display: none !important; }
  #diagram { height: 100vh !important; }
}
</style>
</head>
<body>
<div class="toolbar">
  <span class="title">${title}</span>
  <button class="btn" id="zoom-fit">FIT</button>
  <button class="btn" id="zoom-in">+</button>
  <button class="btn" id="zoom-out">−</button>
  <button class="btn solid" id="export-pdf" onclick="window.print()">↓ PDF A3</button>
  <button class="btn solid" id="export-svg">↓ SVG</button>
  <button class="btn solid" id="export-bpmn">↓ BPMN</button>
</div>
<div id="diagram"></div>
<script src="https://unpkg.com/bpmn-js@18.16.0/dist/bpmn-navigated-viewer.production.min.js"></script>
<script>
const viewer = new BpmnJS({ container: '#diagram' });
(async () => {
  try {
    await viewer.importXML(\`${escaped}\`);
    viewer.get('canvas').zoom('fit-viewport', 'auto');
    document.body.setAttribute('data-bpmn-ready', '1');
  } catch (err) {
    document.getElementById('diagram').innerHTML =
      '<div style="padding:40px;text-align:center;color:#C62828">Failed to render: ' + err.message + '</div>';
    document.body.setAttribute('data-bpmn-ready', 'error');
  }
})();
document.getElementById('zoom-fit').onclick = () => viewer.get('canvas').zoom('fit-viewport', 'auto');
document.getElementById('zoom-in').onclick  = () => viewer.get('zoomScroll').stepZoom(1);
document.getElementById('zoom-out').onclick = () => viewer.get('zoomScroll').stepZoom(-1);
document.getElementById('export-svg').onclick = async () => {
  const { svg } = await viewer.saveSVG();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  a.download = '${code}-bpmn.svg'; a.click();
};
document.getElementById('export-bpmn').onclick = async () => {
  const { xml } = await viewer.saveXML({ format: true });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([xml], { type: 'application/xml' }));
  a.download = '${code}-bpmn.xml'; a.click();
};
</script>
</body>
</html>`;
}

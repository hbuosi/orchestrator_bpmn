interface ViewerOptions {
  hiddenForExport?: boolean;
  title?: string;
}

export function bpmnViewerTemplate(bpmnXml: string, opts: ViewerOptions = {}): string {
  const escaped = bpmnXml
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${opts.title ?? 'BPMN Diagram'}</title>
<script src="https://unpkg.com/bpmn-js@17/dist/bpmn-viewer.production.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #fafafa; }
  #canvas { width: 100%; height: 100vh; ${opts.hiddenForExport ? 'position:absolute;top:0;left:0;' : ''} }
  .djs-palette { display: none !important; }
</style>
</head>
<body>
<div id="canvas"></div>
<script>
  const bpmnXML = \`${escaped}\`;
  const viewer = new BpmnJS({ container: '#canvas' });
  viewer.importXML(bpmnXML).then(() => {
    viewer.get('canvas').zoom('fit-viewport', 'auto');
  }).catch(err => console.error('BPMN render error:', err));
</script>
</body>
</html>`;
}

// Shared utilities for all manifest templates

export function esc(s: unknown): string {
  if (s === null || s === undefined) return '—';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function bool(v: boolean): string {
  return v ? '✓' : '—';
}

export const MANIFEST_CSS = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
:root {
  --navy: #1B2A4A;
  --navy-light: #2c3e6b;
  --ink: #1a1d23;
  --paper: #ffffff;
  --paper-2: #f5f6f8;
  --rule: #d0d5dd;
  --accent: #2E7D32;
  --muted: #6b7280;
  --s0: #2E7D32;
  --s1: #1565C0;
  --s2: #E65100;
  --s3: #6A1B9A;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 14px; }
body {
  background: var(--paper);
  color: var(--ink);
  font-family: "Inter", -apple-system, sans-serif;
  line-height: 1.55;
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 40px 80px;
}
.doc-header {
  background: var(--navy);
  color: #fff;
  padding: 28px 36px 24px;
  margin: -32px -40px 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}
.doc-header-left { flex: 1; }
.doc-kicker {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: rgba(255,255,255,0.6);
  margin-bottom: 8px;
}
.doc-title {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;
}
.doc-subtitle {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
}
.doc-meta {
  text-align: right;
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  line-height: 1.8;
}
.stage-badge {
  display: inline-block;
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 4px 10px;
  border-radius: 2px;
  margin-bottom: 12px;
}
.stage-badge.s0 { background: rgba(46,125,50,0.15); color: var(--s0); border: 1px solid rgba(46,125,50,0.3); }
.stage-badge.s1 { background: rgba(21,101,192,0.12); color: var(--s1); border: 1px solid rgba(21,101,192,0.3); }
.stage-badge.s2 { background: rgba(230,81,0,0.1); color: var(--s2); border: 1px solid rgba(230,81,0,0.3); }
.stage-badge.s3 { background: rgba(106,27,154,0.1); color: var(--s3); border: 1px solid rgba(106,27,154,0.3); }
.section {
  margin-bottom: 40px;
  page-break-inside: avoid;
}
.section-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--rule);
}
.section-num {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  flex-shrink: 0;
}
.section-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--navy);
}
.kv-grid {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 0;
  border: 1px solid var(--rule);
  border-radius: 4px;
  overflow: hidden;
  font-size: 13px;
}
.kv-grid .k {
  background: var(--paper-2);
  padding: 8px 14px;
  font-weight: 600;
  font-size: 12px;
  color: var(--navy);
  border-bottom: 1px solid var(--rule);
}
.kv-grid .v {
  padding: 8px 14px;
  border-bottom: 1px solid var(--rule);
  border-left: 1px solid var(--rule);
}
.kv-grid .k:last-child, .kv-grid .v:last-child { border-bottom: none; }
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  margin: 4px 0;
  border: 1px solid var(--rule);
}
th {
  background: var(--navy);
  color: #fff;
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
}
td {
  padding: 7px 12px;
  border-bottom: 1px solid var(--rule);
  vertical-align: top;
}
tr:nth-child(even) td { background: var(--paper-2); }
tr:last-child td { border-bottom: none; }
.badge {
  display: inline-block;
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.badge.pass { background: #E8F5E9; color: #2E7D32; }
.badge.fail { background: #FFEBEE; color: #C62828; }
.badge.na   { background: #F5F5F5; color: #757575; }
.badge.arch-cap { background: #E3F2FD; color: #1565C0; }
.badge.arch-comp { background: #FFF3E0; color: #E65100; }
.badge.arch-orch { background: #F3E5F5; color: #6A1B9A; }
.badge.mat-ratified { background: #E8F5E9; color: #2E7D32; }
.badge.mat-stable { background: #E3F2FD; color: #1565C0; }
.badge.mat-provisional { background: #FFF3E0; color: #E65100; }
.badge.mat-candidate { background: #F5F5F5; color: #616161; }
.badge.mat-deprecated { background: #FFEBEE; color: #C62828; }
.badge.auto { background: #E0F7FA; color: #00695C; }
.badge.manual { background: #F3E5F5; color: #6A1B9A; }
.badge.assisted { background: #FFF3E0; color: #E65100; }
.badge.risk-risk { background: #FFEBEE; color: #C62828; }
.badge.risk-issue { background: #FFF3E0; color: #E65100; }
.badge.risk-decision { background: #E3F2FD; color: #1565C0; }
.badge.risk-open { background: #F5F5F5; color: #616161; }
.tag-list { display: flex; flex-wrap: wrap; gap: 4px; }
.tag {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--paper-2);
  border: 1px solid var(--rule);
  border-radius: 2px;
  font-family: "JetBrains Mono", monospace;
}
ul { padding-left: 18px; }
li { margin: 3px 0; font-size: 13px; }
.toolbar {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  gap: 8px;
  z-index: 100;
}
.btn {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 10px 18px;
  background: var(--navy);
  color: #fff;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: background 0.15s, transform 0.1s;
}
.btn:hover { background: #0d1b35; transform: translateY(-1px); }
.divider {
  margin: 48px -40px;
  height: 4px;
  background: var(--navy);
}
.info-box {
  background: var(--paper-2);
  border-left: 4px solid var(--navy);
  padding: 12px 16px;
  font-size: 13px;
  margin: 12px 0;
}
@media print {
  body { padding: 16px 24px; max-width: none; }
  .doc-header { margin: -16px -24px 32px; }
  .toolbar { display: none !important; }
  .section { page-break-inside: avoid; }
  .page-break { page-break-before: always; }
}
</style>`;

export function docHeader(opts: {
  serviceCode: string;
  title: string;
  subtitle: string;
  stageBadge: string;
  stageClass: string;
  sections: string;
}): string {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return `
<div class="doc-header">
  <div class="doc-header-left">
    <div class="doc-kicker">DGE Service Orchestrator · Business Service Design Framework v2.6</div>
    <div class="doc-title">${esc(opts.title)}</div>
    <div class="doc-subtitle">${esc(opts.serviceCode)} · ${esc(opts.subtitle)}</div>
  </div>
  <div class="doc-meta">
    <div><span class="stage-badge ${opts.stageClass}">${esc(opts.stageBadge)}</span></div>
    <div>Sections ${esc(opts.sections)}</div>
    <div>${today}</div>
  </div>
</div>`;
}

export function sectionHeader(num: string, title: string): string {
  return `<div class="section-header"><span class="section-num">§${num}</span><span class="section-title">${esc(title)}</span></div>`;
}

export function maturityBadge(m: string): string {
  const cls = `mat-${m.toLowerCase()}`;
  return `<span class="badge ${cls}">${esc(m)}</span>`;
}

export function digitizationBadge(m: string): string {
  const cls = m === 'automated' ? 'auto' : m === 'manual' ? 'manual' : 'assisted';
  return `<span class="badge ${cls}">${esc(m)}</span>`;
}

export function riskBadge(t: string): string {
  const map: Record<string, string> = { Risk: 'risk', Issue: 'issue', 'Decision needed': 'decision', 'Open question': 'open' };
  return `<span class="badge risk-${map[t] ?? 'open'}">${esc(t)}</span>`;
}

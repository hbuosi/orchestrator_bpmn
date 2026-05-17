'use client';

import { useState, useRef, useCallback } from 'react';
import type { Stage0, Stage1, Stage2, Stage3 } from '@/lib/schemas/manifest.schema';

type State = 'idle' | 'loading' | 'error';
type InputMode = 'text' | 'file';
type GenerationMode = 'service-card' | 'manifest-single' | 'manifest-stage';

const STEPS_CARD = [
  'Analyzing your process description...',
  'Parsing service definition...',
  'Generating BPMN diagram...',
  'Building combined viewer...',
];
const STEPS_MANIFEST_SINGLE = [
  'Analyzing service for full manifest...',
  'Rendering Stage 0 — Service Definition...',
  'Rendering Stages 1–3 + complete manifest...',
  'Generating BPMN diagram...',
  'Packaging all 5 documents...',
];
const STEPS_MANIFEST_STAGE = [
  'Generating stage...',
  'Rendering stage document...',
  'Building complete manifest...',
];

const EXAMPLE = `Cybersecurity Incident Response — CYB-IR001 (Critical Variant)
Abu Dhabi DGE — Information Security Operations

A reporter (employee, system alert, or external party) submits an incident report through the security portal or service desk. The System automatically acknowledges receipt within 15 minutes (Milestone 1) and starts the SLA timer — Critical incidents must be resolved within 24 hours.

A Cyber Analyst performs an Initial Assessment (45 min) then classifies the incident and sends acknowledgement notification M2 (15 min). The Cyber Lead reviews: if classified Critical, the Cyber Lead declares a Critical Incident and appoints an Incident Commander (30 min); if not Critical, the case is returned to the Analyst for re-triage. Once declared Critical, the System sends an Executive Brief (M-ALERT) to senior stakeholders.

The Analyst collects digital evidence (2h) then determines the root cause (2h). IT Support executes containment actions (4h) and the System sends a Containment Milestone notification M3. Risk & Compliance then evaluates whether the incident triggers a regulatory or data breach obligation. If yes, the Risk & Compliance team invokes the Breach Management procedure (2h) before recovery. If no breach, the process proceeds directly to recovery.

IT Support eradicates the threat and recovers affected systems (variable duration). The Cyber Lead verifies resolution. If resolution is not confirmed, IT Support re-runs eradication and recovery — maximum 2 rework cycles before mandatory escalation. Once verified, the Analyst documents and closes the case (4h), the System sends Closure notification plus CSAT survey (M5), and archives the case record.

Finally, the Cyber Lead conducts a Post-Incident Review (PIR) within 10 business days, updates the Knowledge Base, and publishes lessons-learned and control improvements (M6).

Participants: Reporter · System · Cyber Analyst · Cyber Lead / IC · IT Support · Risk & Compliance
Regulatory basis: UAE National Cybersecurity Strategy, NCA ECC-1:2018, NESA UAE IA Standards
SLA: Critical 24h end-to-end · PIR within 10 business days
Channels: Security portal (online) · Service desk (call-center) · Automated SIEM alert (system)
Owning entity: Abu Dhabi DGE — Information Security Operations`;

// Labels shown in Stage-by-Stage review gates
const STAGE_LABELS = [
  { num: 0, name: 'Stage 0', desc: 'Service Definition §1–7', color: '#2E7D32' },
  { num: 1, name: 'Stage 1', desc: 'Service Design §8–13', color: '#1565C0' },
  { num: 2, name: 'Stage 2', desc: 'Task Model & Workflow §14–22', color: '#E65100' },
  { num: 3, name: 'Stage 3', desc: 'Build-Ready Requirements §23–27', color: '#6A1B9A' },
];

interface ManifestOutputs {
  stage0?: string;
  stage1?: string;
  stage2?: string;
  stage3?: string;
  complete?: string;
}

interface StageState {
  html: string;
  url: string;
  manifest: Stage0 | Stage1 | Stage2 | Stage3;
}

function makeUrl(html: string): string {
  return URL.createObjectURL(new Blob([html], { type: 'text/html' }));
}

export default function Home() {
  const [state, setState] = useState<State>('idle');
  const [step, setStep] = useState(0);
  const [stepMsg, setStepMsg] = useState('');
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [generationMode, setGenerationMode] = useState<GenerationMode>('service-card');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Result state
  const [resultUrl, setResultUrl] = useState<string | null>(null); // service-card mode
  const [manifestOutputs, setManifestOutputs] = useState<ManifestOutputs>({}); // single-pass manifest
  const [stageResults, setStageResults] = useState<(StageState | null)[]>([null, null, null, null]); // stage-by-stage
  const [currentStage, setCurrentStage] = useState<0 | 1 | 2 | 3>(0);
  const [completedManifestUrl, setCompletedManifestUrl] = useState<string | null>(null);

  // Accumulated manifest data across stage-by-stage calls
  const accumulatedStages = useRef<{ stage0?: Stage0; stage1?: Stage1; stage2?: Stage2 }>({});

  const isReady = inputMode === 'text' ? text.trim() !== '' : uploadedFile !== null;
  const currentSteps = generationMode === 'service-card'
    ? STEPS_CARD
    : generationMode === 'manifest-single'
    ? STEPS_MANIFEST_SINGLE
    : STEPS_MANIFEST_STAGE;

  function revokePreviousUrls() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    Object.values(manifestOutputs).forEach(url => url && URL.revokeObjectURL(url));
    stageResults.forEach(s => s?.url && URL.revokeObjectURL(s.url));
    if (completedManifestUrl) URL.revokeObjectURL(completedManifestUrl);
  }

  function resetResults() {
    revokePreviousUrls();
    setResultUrl(null);
    setManifestOutputs({});
    setStageResults([null, null, null, null]);
    setCurrentStage(0);
    setCompletedManifestUrl(null);
    accumulatedStages.current = {};
  }

  async function generate(stageOverride?: 0 | 1 | 2 | 3) {
    if (!isReady) return;
    setState('loading');
    setStep(0);
    setStepMsg(currentSteps[0]!);
    setError('');

    const stageToGenerate = stageOverride ?? currentStage;

    try {
      let res: Response;
      const mode = generationMode;

      if (inputMode === 'file' && uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('mode', mode);
        res = await fetch('/api/generate', { method: 'POST', body: formData });
      } else {
        const body: Record<string, unknown> = { text, mode };
        if (mode === 'manifest-stage') {
          body.stage = stageToGenerate;
          body.previousStages = accumulatedStages.current;
        }
        res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok || !res.body) throw new Error(`Server error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const event = JSON.parse(line.slice(6)) as {
            type: string;
            step?: number; message?: string;
            html?: string;
            outputs?: ManifestOutputs;
            stage?: number;
            manifest?: Stage0 | Stage1 | Stage2 | Stage3;
            completeHtml?: string;
          };

          if (event.type === 'progress') {
            setStep((event.step ?? 1) - 1);
            setStepMsg(event.message ?? '');

          } else if (event.type === 'complete' && event.html) {
            // Service card mode
            const url = makeUrl(event.html);
            setResultUrl(url);
            setState('idle');

          } else if (event.type === 'manifest_complete' && event.outputs) {
            // Mode A: single-pass — turn HTML strings into blob URLs
            const urls: ManifestOutputs = {};
            if (event.outputs.stage0) urls.stage0 = makeUrl(event.outputs.stage0);
            if (event.outputs.stage1) urls.stage1 = makeUrl(event.outputs.stage1);
            if (event.outputs.stage2) urls.stage2 = makeUrl(event.outputs.stage2);
            if (event.outputs.stage3) urls.stage3 = makeUrl(event.outputs.stage3);
            if (event.outputs.complete) urls.complete = makeUrl(event.outputs.complete);
            setManifestOutputs(urls);
            setState('idle');

          } else if (event.type === 'stage_complete') {
            // Mode B: stage-by-stage
            const sNum = event.stage as 0 | 1 | 2 | 3;
            const url = makeUrl(event.html!);
            const stageState: StageState = { html: event.html!, url, manifest: event.manifest! };

            // Accumulate manifest data for next stage calls
            if (sNum === 0) accumulatedStages.current.stage0 = event.manifest as Stage0;
            if (sNum === 1) accumulatedStages.current.stage1 = event.manifest as Stage1;
            if (sNum === 2) accumulatedStages.current.stage2 = event.manifest as Stage2;

            setStageResults(prev => {
              const next = [...prev] as (StageState | null)[];
              next[sNum] = stageState;
              return next;
            });

            if (event.completeHtml) {
              setCompletedManifestUrl(makeUrl(event.completeHtml));
            }

            setState('idle');

          } else if (event.type === 'error') {
            throw new Error(event.message ?? 'Unknown error');
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState('error');
    }
  }

  function proceedToStage(n: 0 | 1 | 2 | 3) {
    setCurrentStage(n);
    generate(n);
  }

  function handleFileSelect(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['xlsx', 'xls', 'csv', 'ods'].includes(ext)) {
      setError('Unsupported file type. Please upload .xlsx, .xls, .csv, or .ods');
      setState('error');
      return;
    }
    setUploadedFile(file);
    setError('');
    if (state === 'error') setState('idle');
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const hasSinglePassResults = Object.keys(manifestOutputs).length > 0;
  const hasServiceCardResult = resultUrl !== null;
  const hasAnyResult = hasSinglePassResults || hasServiceCardResult || stageResults.some(s => s !== null);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48, maxWidth: 640 }}>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.18em',
          color: 'var(--muted)', marginBottom: 16,
          display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'baseline',
        }}>
          <span style={{ color: 'var(--accent)' }}>●</span>
          <span>DGE Service Orchestrator</span>
          <span>·</span>
          <span>Business Service Design Framework v2.6</span>
        </div>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontWeight: 900, fontSize: 'clamp(32px, 5vw, 56px)',
          lineHeight: 0.95, letterSpacing: '-0.02em',
          margin: '0 0 16px', color: 'var(--ink)',
        }}>
          Describe your service.<br />
          <span style={{ color: 'var(--accent)' }}>We generate the rest.</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, margin: 0, lineHeight: 1.6 }}>
          Enter a government service in plain language or upload a spreadsheet.
          Generate a complete Service Manifest (§1–27) ready to export as PDF.
        </p>
      </div>

      {/* Form */}
      <div style={{ width: '100%', maxWidth: 720 }}>

        {/* Generation mode selector */}
        <div style={{
          marginBottom: 20,
          padding: '16px 20px',
          background: 'var(--paper-2)',
          border: '1.5px solid var(--rule)',
        }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            color: 'var(--muted)', marginBottom: 12,
          }}>
            Generation Mode
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([
              {
                id: 'service-card' as GenerationMode,
                label: 'Service Card + BPMN',
                desc: 'Quick generation: service card + BPMN diagram in one combined viewer',
              },
              {
                id: 'manifest-single' as GenerationMode,
                label: 'Full Manifest — Single Pass',
                desc: 'Generates all 4 stages at once (§1–27). Opens 5 separate PDF documents.',
              },
              {
                id: 'manifest-stage' as GenerationMode,
                label: 'Full Manifest — Stage by Stage',
                desc: 'Generates one stage at a time with review gates between each stage.',
              },
            ] as const).map(opt => (
              <label key={opt.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                cursor: 'pointer', padding: '10px 12px',
                background: generationMode === opt.id ? '#fff' : 'transparent',
                border: `1.5px solid ${generationMode === opt.id ? 'var(--ink)' : 'transparent'}`,
                transition: 'all 0.15s',
              }}>
                <input
                  type="radio"
                  name="generationMode"
                  value={opt.id}
                  checked={generationMode === opt.id}
                  onChange={() => { setGenerationMode(opt.id); resetResults(); }}
                  style={{ marginTop: 2, accentColor: 'var(--ink)', flexShrink: 0 }}
                />
                <div>
                  <div style={{
                    fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
                    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: generationMode === opt.id ? 'var(--ink)' : 'var(--muted)',
                  }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                    {opt.desc}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Input mode tabs */}
        <div style={{ display: 'flex', marginBottom: 0, borderBottom: '2px solid var(--rule)' }}>
          {(['text', 'file'] as InputMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => { setInputMode(mode); setError(''); if (state === 'error') setState('idle'); }}
              style={{
                padding: '10px 20px',
                background: 'transparent', border: 'none',
                borderBottom: inputMode === mode ? '2px solid var(--ink)' : '2px solid transparent',
                marginBottom: -2, cursor: 'pointer',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em',
                color: inputMode === mode ? 'var(--ink)' : 'var(--muted)',
                fontWeight: inputMode === mode ? 600 : 400,
              }}
            >
              {mode === 'text' ? '✎ Text' : '↑ Upload File'}
            </button>
          ))}
        </div>

        {/* Text input */}
        {inputMode === 'text' && (
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={EXAMPLE}
            disabled={state === 'loading'}
            rows={8}
            style={{
              width: '100%', padding: '20px 24px',
              fontSize: 14.5, lineHeight: 1.65, color: 'var(--ink)',
              background: '#fff', border: '2px solid var(--rule)',
              borderTop: 'none', borderRadius: 0, outline: 'none',
              resize: 'vertical', fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--ink)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--rule)'; }}
          />
        )}

        {/* File upload */}
        {inputMode === 'file' && (
          <div
            onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
            onClick={() => !uploadedFile && fileInputRef.current?.click()}
            style={{
              border: `2px ${isDragging ? 'solid' : 'dashed'} ${isDragging ? 'var(--ink)' : 'var(--rule)'}`,
              borderTop: 'none',
              background: isDragging ? 'var(--paper-2)' : '#fff',
              padding: '40px 24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 12, cursor: uploadedFile ? 'default' : 'pointer',
              minHeight: 160, justifyContent: 'center',
            }}
          >
            <input
              ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv,.ods"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
            {!uploadedFile ? (
              <>
                <div style={{ fontSize: 32, lineHeight: 1 }}>📊</div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)' }}>
                  Drop file here or click to browse
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Supports .xlsx · .xls · .csv · .ods — all sheets will be read
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--paper-2)', border: '1.5px solid var(--rule)', width: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: 24 }}>📄</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadedFile.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: '"JetBrains Mono", monospace', marginTop: 3 }}>
                    {(uploadedFile.size / 1024).toFixed(1)} KB · ready to generate
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  style={{ background: 'transparent', border: '1.5px solid var(--rule)', cursor: 'pointer', padding: '4px 10px', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', flexShrink: 0 }}
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>
        )}

        {/* Generate button */}
        <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => generate()}
            disabled={state === 'loading' || !isReady}
            style={{
              padding: '14px 32px',
              background: state === 'loading' || !isReady ? 'var(--muted)' : 'var(--ink)',
              color: 'var(--paper)', border: 'none',
              cursor: state === 'loading' || !isReady ? 'default' : 'pointer',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}
          >
            {state === 'loading' ? 'Generating...' : 'Generate →'}
          </button>
          {inputMode === 'text' && text.trim() === '' && (
            <button
              onClick={() => setText(EXAMPLE)}
              style={{
                padding: '14px 20px', background: 'transparent',
                color: 'var(--muted)', border: '1.5px solid var(--rule)',
                cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
              }}
            >
              Load example
            </button>
          )}
        </div>

        {/* Progress */}
        {state === 'loading' && (
          <div style={{ marginTop: 32, padding: '24px 28px', background: 'var(--paper-2)', borderLeft: '3px solid var(--accent)' }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 16 }}>
              Processing
            </div>
            {currentSteps.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, opacity: i > step ? 0.35 : 1, transition: 'opacity 0.3s' }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: i < step ? 'var(--accent)' : i === step ? 'var(--ink)' : 'var(--rule)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: i <= step ? '#fff' : 'var(--muted)', fontSize: 10, fontWeight: 700, flexShrink: 0,
                }}>
                  {i < step ? '✓' : i + 1}
                </span>
                <span style={{ fontSize: 13, color: i === step ? 'var(--ink)' : 'var(--muted)', fontWeight: i === step ? 500 : 400 }}>
                  {i === step ? stepMsg : s}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Result: Service Card mode ── */}
        {hasServiceCardResult && state === 'idle' && (
          <div style={{ marginTop: 24, padding: '20px 24px', background: '#F1F8F1', borderLeft: '3px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: 4 }}>
                ✓ Done
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--ink)' }}>
                Service Card + BPMN generated successfully.
              </p>
              <a
                href={resultUrl!}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setTimeout(() => { URL.revokeObjectURL(resultUrl!); setResultUrl(null); }, 60000)}
                style={{ display: 'inline-block', padding: '8px 18px', background: 'var(--ink)', color: 'var(--paper)', textDecoration: 'none', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}
              >
                Open Result in New Tab →
              </a>
            </div>
            <button onClick={() => { setResultUrl(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--muted)', flexShrink: 0 }}>×</button>
          </div>
        )}

        {/* ── Result: Single-Pass Manifest mode ── */}
        {hasSinglePassResults && state === 'idle' && (
          <div style={{ marginTop: 24, padding: '24px', background: '#F1F8F1', borderLeft: '3px solid var(--accent)' }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: 12 }}>
              ✓ Service Manifest Generated — 5 Documents
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STAGE_LABELS.map(sl => {
                const url = manifestOutputs[`stage${sl.num}` as keyof ManifestOutputs];
                return url ? (
                  <a key={sl.num} href={url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fff', border: `1.5px solid ${sl.color}`, textDecoration: 'none', color: 'var(--ink)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: sl.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{sl.name} — {sl.desc}</div>
                    </div>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'var(--muted)' }}>Open →</span>
                  </a>
                ) : null;
              })}
              {manifestOutputs.complete && (
                <a href={manifestOutputs.complete} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--ink)', textDecoration: 'none', color: '#fff', marginTop: 4 }}>
                  <span style={{ fontSize: 14 }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Complete Manifest §1–27</div>
                  </div>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10 }}>Open →</span>
                </a>
              )}
            </div>
            <button onClick={() => setManifestOutputs({})} style={{ marginTop: 14, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--muted)' }}>× Dismiss</button>
          </div>
        )}

        {/* ── Result: Stage-by-Stage mode ── */}
        {generationMode === 'manifest-stage' && stageResults.some(s => s !== null) && (
          <div style={{ marginTop: 24, padding: '24px', background: 'var(--paper-2)', borderLeft: '3px solid var(--accent)' }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 16 }}>
              Stage-by-Stage Progress
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {STAGE_LABELS.map(sl => {
                const result = stageResults[sl.num];
                const isCurrentTarget = currentStage === sl.num && state === 'loading';
                const isDone = result !== null;
                const isNext = !isDone && stageResults[sl.num - 1] !== null && sl.num > 0 && state === 'idle';
                const isFirst = sl.num === 0 && !isDone && state === 'idle';

                return (
                  <div key={sl.num} style={{
                    padding: '14px 16px',
                    background: isDone ? '#fff' : 'transparent',
                    border: `1.5px solid ${isDone ? sl.color : 'var(--rule)'}`,
                    opacity: (!isDone && !isCurrentTarget && !isNext && !isFirst) ? 0.4 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          background: isDone ? sl.color : isCurrentTarget ? 'var(--ink)' : 'var(--rule)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 10, fontWeight: 700,
                        }}>
                          {isDone ? '✓' : sl.num + 1}
                        </span>
                        <div>
                          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: isDone ? sl.color : 'var(--muted)' }}>
                            {sl.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{sl.desc}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        {isDone && result && (
                          <a href={result.url} target="_blank" rel="noopener noreferrer"
                            style={{ padding: '6px 14px', background: sl.color, color: '#fff', textDecoration: 'none', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Open PDF →
                          </a>
                        )}
                        {(isNext || isFirst) && state === 'idle' && (
                          <button
                            onClick={() => proceedToStage(sl.num as 0 | 1 | 2 | 3)}
                            style={{ padding: '6px 14px', background: 'var(--ink)', color: 'var(--paper)', border: 'none', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                          >
                            {sl.num === 0 ? 'Generate →' : `Generate ${sl.name} →`}
                          </button>
                        )}
                        {isCurrentTarget && (
                          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'var(--muted)', padding: '6px 0' }}>Generating...</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {completedManifestUrl && (
              <a href={completedManifestUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--ink)', textDecoration: 'none', color: '#fff', marginTop: 16 }}>
                <span style={{ fontSize: 14 }}>📄</span>
                <div style={{ flex: 1, fontFamily: '"JetBrains Mono", monospace', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Complete Manifest §1–27 — All Stages
                </div>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10 }}>Open →</span>
              </a>
            )}

            <button onClick={() => { resetResults(); setCurrentStage(0); }} style={{ marginTop: 14, background: 'transparent', border: '1.5px solid var(--rule)', cursor: 'pointer', padding: '6px 14px', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>
              ↺ Start Over
            </button>
          </div>
        )}

        {/* For stage-by-stage: show generate button for stage 0 if no results yet */}
        {generationMode === 'manifest-stage' && !stageResults.some(s => s !== null) && state === 'idle' && !hasAnyResult && null}

        {/* Error */}
        {state === 'error' && (
          <div style={{ marginTop: 24, padding: '20px 24px', background: '#FFF5F5', borderLeft: '3px solid var(--error)' }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--error)', marginBottom: 8 }}>
              Error
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink)' }}>{error}</p>
            <button onClick={() => setState('idle')} style={{ marginTop: 14, padding: '8px 16px', background: 'transparent', border: '1.5px solid var(--rule)', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 64, textAlign: 'center',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10.5, color: 'var(--muted)',
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        Abu Dhabi DGE · Business Service Design Framework v2.6 · BPMN 2.0
      </div>
    </div>
  );
}

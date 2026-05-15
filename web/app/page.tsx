'use client';

import { useState, useRef, useCallback } from 'react';

type State = 'idle' | 'loading' | 'complete' | 'error';
type InputMode = 'text' | 'file';

const STEPS = [
  'Analyzing your process description...',
  'Parsing service definition...',
  'Generating BPMN diagram...',
  'Building combined viewer...',
];

const EXAMPLE = `Trade License Renewal — Abu Dhabi DED

A business owner renews their trade license online via TAMM. The system verifies the license validity and outstanding fees. If fees are owed, the applicant pays online. The system then confirms the renewal, issues a digital certificate, and notifies the business via SMS and email.`;

export default function Home() {
  const [state, setState] = useState<State>('idle');
  const [step, setStep] = useState(0);
  const [stepMsg, setStepMsg] = useState('');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isReady = inputMode === 'text' ? text.trim() !== '' : uploadedFile !== null;

  async function generate() {
    if (!isReady) return;
    setState('loading');
    setStep(0);
    setStepMsg(STEPS[0]!);
    setError('');

    try {
      let res: Response;

      if (inputMode === 'file' && uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        res = await fetch('/api/generate', { method: 'POST', body: formData });
      } else {
        res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
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
            type: string; step?: number; message?: string; html?: string;
          };

          if (event.type === 'progress' && event.step !== undefined) {
            setStep(event.step - 1);
            setStepMsg(event.message ?? STEPS[event.step - 1] ?? '');
          } else if (event.type === 'complete' && event.html) {
            const blob = new Blob([event.html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            setBlobUrl(url);
            setState('complete');
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

  function reset() {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setState('idle');
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

  if (state === 'complete' && blobUrl) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          background: 'var(--ink)', color: 'var(--paper)',
          padding: '10px 20px',
          display: 'flex', alignItems: 'center', gap: 16,
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          zIndex: 100, flexShrink: 0,
        }}>
          <button
            onClick={reset}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
              color: 'var(--paper)', cursor: 'pointer', padding: '5px 12px',
              fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit',
            }}
          >
            ← New
          </button>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>GSD Service Orchestrator</span>
          <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)' }}>
            Use ↓ PDF A3 inside the viewer to export
          </span>
        </div>
        <iframe
          ref={iframeRef}
          src={blobUrl}
          style={{ flex: 1, border: 'none', width: '100%' }}
          title="Generated Service Card + BPMN"
        />
      </div>
    );
  }

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
          <span>GSD Service Orchestrator</span>
          <span>·</span>
          <span>BPMN 2.0 + Service Card</span>
        </div>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontWeight: 900, fontSize: 'clamp(36px, 6vw, 64px)',
          lineHeight: 0.95, letterSpacing: '-0.02em',
          margin: '0 0 16px', color: 'var(--ink)',
        }}>
          Describe your service.<br />
          <span style={{ color: 'var(--accent)' }}>We generate the rest.</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, margin: 0, lineHeight: 1.6 }}>
          Enter a government service in plain language or upload a spreadsheet.
          Get a complete Service Card + BPMN 2.0 diagram, ready to export as A3 PDF.
        </p>
      </div>

      {/* Form */}
      <div style={{ width: '100%', maxWidth: 680 }}>

        {/* Mode tabs */}
        <div style={{
          display: 'flex', marginBottom: 0,
          borderBottom: '2px solid var(--rule)',
        }}>
          {(['text', 'file'] as InputMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => { setInputMode(mode); setError(''); if (state === 'error') setState('idle'); }}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: inputMode === mode ? '2px solid var(--ink)' : '2px solid transparent',
                marginBottom: -2,
                cursor: 'pointer',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em',
                color: inputMode === mode ? 'var(--ink)' : 'var(--muted)',
                fontWeight: inputMode === mode ? 600 : 400,
                transition: 'color 0.15s',
              }}
            >
              {mode === 'text' ? '✎ Text' : '↑ Upload File'}
            </button>
          ))}
        </div>

        {/* Text input */}
        {inputMode === 'text' && (
          <div style={{ position: 'relative' }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={EXAMPLE}
              disabled={state === 'loading'}
              rows={8}
              style={{
                width: '100%',
                padding: '20px 24px',
                fontSize: 14.5,
                lineHeight: 1.65,
                color: 'var(--ink)',
                background: '#fff',
                border: '2px solid var(--rule)',
                borderTop: 'none',
                borderRadius: 0,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--ink)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--rule)'; }}
            />
          </div>
        )}

        {/* File upload */}
        {inputMode === 'file' && (
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => !uploadedFile && fileInputRef.current?.click()}
            style={{
              border: `2px ${isDragging ? 'solid' : 'dashed'} ${isDragging ? 'var(--ink)' : 'var(--rule)'}`,
              borderTop: 'none',
              background: isDragging ? 'var(--paper-2)' : '#fff',
              padding: '40px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              cursor: uploadedFile ? 'default' : 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
              minHeight: 160,
              justifyContent: 'center',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.ods"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />

            {!uploadedFile ? (
              <>
                <div style={{ fontSize: 32, lineHeight: 1 }}>📊</div>
                <div style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: 'var(--muted)',
                }}>
                  Drop file here or click to browse
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Supports .xlsx · .xls · .csv · .ods — all sheets will be read
                </div>
              </>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 20px',
                background: 'var(--paper-2)',
                border: '1.5px solid var(--rule)',
                width: '100%',
                boxSizing: 'border-box',
              }}>
                <span style={{ fontSize: 24 }}>📄</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 500, fontSize: 14,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {uploadedFile.name}
                  </div>
                  <div style={{
                    fontSize: 12, color: 'var(--muted)',
                    fontFamily: '"JetBrains Mono", monospace',
                    marginTop: 3,
                  }}>
                    {(uploadedFile.size / 1024).toFixed(1)} KB · ready to generate
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  style={{
                    background: 'transparent', border: '1.5px solid var(--rule)',
                    cursor: 'pointer', padding: '4px 10px',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: 'var(--muted)', flexShrink: 0,
                  }}
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={generate}
            disabled={state === 'loading' || !isReady}
            style={{
              padding: '14px 32px',
              background: state === 'loading' || !isReady ? 'var(--muted)' : 'var(--ink)',
              color: 'var(--paper)',
              border: 'none', cursor: state === 'loading' || !isReady ? 'default' : 'pointer',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => {
              if (state !== 'loading' && isReady) (e.target as HTMLButtonElement).style.background = '#000';
            }}
            onMouseLeave={e => {
              if (state !== 'loading' && isReady) (e.target as HTMLButtonElement).style.background = 'var(--ink)';
            }}
          >
            {state === 'loading' ? 'Generating...' : 'Generate →'}
          </button>

          {inputMode === 'text' && text.trim() === '' && (
            <button
              onClick={() => setText(EXAMPLE)}
              style={{
                padding: '14px 20px',
                background: 'transparent',
                color: 'var(--muted)',
                border: '1.5px solid var(--rule)',
                cursor: 'pointer',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
              }}
            >
              Load example
            </button>
          )}
        </div>

        {/* Progress */}
        {state === 'loading' && (
          <div style={{
            marginTop: 32,
            padding: '24px 28px',
            background: 'var(--paper-2)',
            borderLeft: '3px solid var(--accent)',
          }}>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'var(--muted)', marginBottom: 16,
            }}>
              Processing
            </div>
            {STEPS.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 10, opacity: i > step ? 0.35 : 1,
                transition: 'opacity 0.3s',
              }}>
                <span style={{
                  width: 20, height: 20,
                  borderRadius: '50%',
                  background: i < step ? 'var(--accent)' : i === step ? 'var(--ink)' : 'var(--rule)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: i <= step ? '#fff' : 'var(--muted)',
                  fontSize: 10, fontWeight: 700, flexShrink: 0,
                  transition: 'background 0.3s',
                }}>
                  {i < step ? '✓' : i + 1}
                </span>
                <span style={{
                  fontSize: 13,
                  color: i === step ? 'var(--ink)' : 'var(--muted)',
                  fontWeight: i === step ? 500 : 400,
                }}>
                  {i === step ? stepMsg : s}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div style={{
            marginTop: 24,
            padding: '20px 24px',
            background: '#FFF5F5',
            borderLeft: '3px solid var(--error)',
          }}>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'var(--error)', marginBottom: 8,
            }}>
              Error
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink)' }}>{error}</p>
            <button
              onClick={() => setState('idle')}
              style={{
                marginTop: 14, padding: '8px 16px',
                background: 'transparent', border: '1.5px solid var(--rule)',
                cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
              }}
            >
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
        UAE TDRA · Abu Dhabi TAMM · BPMN 2.0 · BPMN-in-Color Spec
      </div>
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';

type State = 'idle' | 'loading' | 'complete' | 'error';

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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  async function generate() {
    if (!text.trim()) return;
    setState('loading');
    setStep(0);
    setStepMsg(STEPS[0]!);
    setError('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

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
          Enter a government service or business process in plain language.
          Get a complete Service Card + BPMN 2.0 diagram, ready to export as A3 PDF.
        </p>
      </div>

      {/* Form */}
      <div style={{ width: '100%', maxWidth: 680 }}>
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
              borderRadius: 0,
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--ink)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--rule)'; }}
          />
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={generate}
            disabled={state === 'loading' || !text.trim()}
            style={{
              padding: '14px 32px',
              background: state === 'loading' ? 'var(--muted)' : 'var(--ink)',
              color: 'var(--paper)',
              border: 'none', cursor: state === 'loading' ? 'default' : 'pointer',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              transition: 'background 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => {
              if (state !== 'loading') (e.target as HTMLButtonElement).style.background = '#000';
            }}
            onMouseLeave={e => {
              if (state !== 'loading') (e.target as HTMLButtonElement).style.background = 'var(--ink)';
            }}
          >
            {state === 'loading' ? 'Generating...' : 'Generate →'}
          </button>

          {text.trim() === '' && (
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

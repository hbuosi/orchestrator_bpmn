import type { ServiceCard } from '../schemas/service-card.schema.js';

const channelLabel: Record<string, string> = {
  online: 'Online', app: 'Smart App', 'call-center': 'Call Center', 'in-person': 'Service Center',
};
const segmentLabel: Record<string, string> = {
  citizen: 'Citizen', resident: 'Resident', business: 'Business', visitor: 'Visitor',
};
const stageLabel: Record<string, string> = {
  paper: 'Paper', digital: 'Digital', smart: 'Smart', proactive: 'Proactive',
};
const uaePassLevelLabel: Record<number, string> = {
  1: 'Level 1 — Authentication',
  2: 'Level 2 — Identity Data',
  3: 'Level 3 — Digital Signature',
};

export function serviceCardTemplate(card: ServiceCard): string {
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${card.nameEn} — Service Card</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #f5f5f5; }
  .card { max-width: 900px; margin: 24px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); overflow: hidden; }

  /* Header */
  .header { background: #003366; color: #fff; padding: 24px 32px; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .service-code { font-size: 11px; opacity: 0.7; letter-spacing: 1px; text-transform: uppercase; }
  .service-name-en { font-size: 22px; font-weight: 700; margin: 8px 0 4px; }
  .service-name-ar { font-size: 18px; font-weight: 400; direction: rtl; opacity: 0.9; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  .badge { padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge-category { background: rgba(255,255,255,0.2); }
  .badge-stage { background: #00A86B; }
  .badge-uaepass { background: #E65100; }

  /* Grid layout */
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .section { padding: 20px 32px; border-bottom: 1px solid #eee; }
  .section.full { grid-column: 1 / -1; }
  .section-title { font-size: 11px; font-weight: 700; color: #003366; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 2px solid #003366; padding-bottom: 4px; }

  /* Channels */
  .channel-list { display: flex; gap: 8px; flex-wrap: wrap; }
  .channel-chip { padding: 4px 12px; background: #E3F2FD; color: #1565C0; border-radius: 16px; font-size: 12px; font-weight: 600; }

  /* Documents list */
  .doc-list { list-style: none; }
  .doc-list li { padding: 4px 0; padding-left: 16px; position: relative; }
  .doc-list li::before { content: '›'; position: absolute; left: 0; color: #003366; font-weight: bold; }

  /* Fees table */
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #003366; color: #fff; padding: 7px 10px; text-align: left; font-weight: 600; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) td { background: #f9f9f9; }

  /* Journey steps */
  .steps { display: flex; flex-direction: column; gap: 10px; }
  .step { display: flex; gap: 12px; align-items: flex-start; }
  .step-num { width: 28px; height: 28px; border-radius: 50%; background: #003366; color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .step-body { flex: 1; }
  .step-title { font-weight: 600; font-size: 13px; }
  .step-desc { font-size: 12px; color: #555; margin-top: 2px; }
  .step-time { font-size: 11px; color: #888; margin-top: 2px; }

  /* SLA */
  .sla-grid { display: flex; gap: 16px; flex-wrap: wrap; }
  .sla-item { background: #E8F5E9; border-radius: 6px; padding: 8px 14px; text-align: center; }
  .sla-days { font-size: 22px; font-weight: 700; color: #2E7D32; }
  .sla-channel { font-size: 11px; color: #555; margin-top: 2px; }

  /* Output docs */
  .output-list { display: flex; flex-direction: column; gap: 6px; }
  .output-item { background: #FFF8E1; border-left: 3px solid #F57F17; padding: 8px 12px; border-radius: 0 4px 4px 0; }
  .output-name { font-weight: 600; font-size: 13px; }
  .output-meta { font-size: 11px; color: #666; margin-top: 2px; }

  /* Footer */
  .footer { background: #f0f4f8; padding: 14px 32px; font-size: 11px; color: #888; display: flex; justify-content: space-between; }
</style>
</head>
<body>
<div class="card">

  <!-- Header -->
  <div class="header">
    <div class="header-top">
      <div>
        <div class="service-code">${card.serviceCode}</div>
        <div class="service-name-en">${card.nameEn}</div>
        <div class="service-name-ar">${card.nameAr}</div>
      </div>
      <div style="text-align:right; font-size:12px; opacity:0.8;">
        <div>${card.owningEntity}</div>
      </div>
    </div>
    <div class="badges">
      <span class="badge badge-category">${card.category}</span>
      <span class="badge badge-stage">${stageLabel[card.transformationStage]}</span>
      ${card.uaePassEnabled ? `<span class="badge badge-uaepass">UAE Pass ${card.uaePassLevel ? uaePassLevelLabel[card.uaePassLevel] : ''}</span>` : ''}
      ${card.targetSegment.map(s => `<span class="badge" style="background:rgba(255,255,255,0.15)">${segmentLabel[s]}</span>`).join('')}
    </div>
  </div>

  <div class="grid">

    <!-- Channels -->
    <div class="section">
      <div class="section-title">Service Channels</div>
      <div class="channel-list">
        ${card.channels.map(c => `<span class="channel-chip">${channelLabel[c]}</span>`).join('')}
      </div>
    </div>

    <!-- SLA -->
    <div class="section">
      <div class="section-title">Processing Time (SLA)</div>
      <div class="sla-grid">
        ${Object.entries(card.slaDays).map(([ch, days]) => `
          <div class="sla-item">
            <div class="sla-days">${days}</div>
            <div class="sla-channel">${channelLabel[ch] ?? ch} (days)</div>
          </div>`).join('')}
      </div>
    </div>

    <!-- Eligibility -->
    <div class="section">
      <div class="section-title">Eligibility Criteria</div>
      <ul class="doc-list">
        ${card.eligibilityCriteria.map(e => `<li>${e}</li>`).join('')}
      </ul>
    </div>

    <!-- Required Documents -->
    <div class="section">
      <div class="section-title">Required Documents</div>
      <ul class="doc-list">
        ${card.requiredDocuments.map(d => `<li>${d.name}${d.format ? ` <em style="color:#888">(${d.format})</em>` : ''}${d.notes ? ` — ${d.notes}` : ''}</li>`).join('')}
      </ul>
    </div>

    <!-- Journey Steps -->
    <div class="section full">
      <div class="section-title">Service Journey (${card.journeySteps.length} Steps)</div>
      <div class="steps">
        ${card.journeySteps.map(s => `
          <div class="step">
            <div class="step-num">${s.step}</div>
            <div class="step-body">
              <div class="step-title">${s.title}</div>
              <div class="step-desc">${s.description}</div>
              ${s.estimatedMinutes ? `<div class="step-time">~${s.estimatedMinutes} min</div>` : ''}
            </div>
          </div>`).join('')}
      </div>
    </div>

    <!-- Fees -->
    <div class="section full">
      <div class="section-title">Fees (AED)</div>
      <table>
        <tr><th>Channel</th><th>Applicant Type</th><th>Amount (AED)</th></tr>
        ${card.fees.map(f => `<tr><td>${channelLabel[f.channel] ?? f.channel}</td><td>${f.applicantType ?? '—'}</td><td>${f.amountAED === 0 ? 'Free' : f.amountAED.toLocaleString()}</td></tr>`).join('')}
      </table>
    </div>

    <!-- Output Documents -->
    <div class="section">
      <div class="section-title">Output Documents</div>
      <div class="output-list">
        ${card.outputDocuments.map(d => `
          <div class="output-item">
            <div class="output-name">${d.name}</div>
            <div class="output-meta">${d.format}${d.validityDays ? ` · Valid ${d.validityDays} days` : ''} · ${d.deliveryMethod}</div>
          </div>`).join('')}
      </div>
    </div>

    <!-- Legal -->
    <div class="section">
      <div class="section-title">Legal Basis</div>
      <p style="font-size:12px; line-height:1.6">${card.legalBasis}</p>
      ${card.addaComplianceLevel ? `<p style="margin-top:8px; font-size:12px"><strong>ADDA Compliance:</strong> ${card.addaComplianceLevel}</p>` : ''}
      ${card.lifeEvent ? `<p style="margin-top:6px; font-size:12px"><strong>Life Event:</strong> ${card.lifeEvent}</p>` : ''}
    </div>

  </div>

  <div class="footer">
    <span>Generated by GSD Service Orchestrator</span>
    <span>${new Date().toISOString().split('T')[0]}</span>
  </div>
</div>
</body>
</html>`;
}

const analyzeBtn = document.getElementById('analyzeBtn');
const exportBtn = document.getElementById('exportBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const tosInput = document.getElementById('tosInput');
const results = document.getElementById('results');
const mappingList = document.getElementById('mappingList');
const riskList = document.getElementById('riskList');

let currentReport = null;

const legalToPlain = [
  [/\bhereby\b/gi, 'by this'],
  [/\bnotwithstanding\b/gi, 'even if'],
  [/\bpursuant to\b/gi, 'under'],
  [/\bterminated\b/gi, 'ended'],
  [/\bprior written notice\b/gi, 'written warning first'],
  [/\bliability\b/gi, 'legal responsibility'],
  [/\bindemnify\b/gi, 'pay for losses'],
  [/\barbitration\b/gi, 'private legal decision'],
  [/\baffiliate(s)?\b/gi, 'partner companies'],
  [/\bconsent\b/gi, 'agree'],
  [/\bcollect\b/gi, 'take'],
  [/\bdisclose\b/gi, 'share'],
  [/\bgoverning law\b/gi, 'state rules'],
  [/\bautomatically renew\b/gi, 'renew on its own']
];

const riskRules = [
  { key: 'Auto-renewal', level: 'high', re: /auto(?:matic)?\s*renew|renew\s+on\s+its\s+own/i, why: 'Your subscription may keep charging unless you cancel in time.' },
  { key: 'Forced arbitration', level: 'high', re: /arbitration|waive\s+.*class\s+action|no\s+class\s+actions?/i, why: 'You may lose your right to sue in court or join group lawsuits.' },
  { key: 'Data sharing', level: 'medium', re: /share\s+.*data|sell\s+.*data|disclose\s+.*information|third\s+part(y|ies)/i, why: 'Your personal data may be shared with other companies.' },
  { key: 'Unilateral changes', level: 'medium', re: /may\s+change\s+these\s+terms|update\s+these\s+terms\s+at\s+any\s+time/i, why: 'The company can change terms later, which can affect your rights.' },
  { key: 'Limited liability', level: 'high', re: /not\s+liable|limited\s+liability|liability\s+.*limited|as\s+is/i, why: 'It may be hard to recover money if something goes wrong.' },
  { key: 'Account termination', level: 'medium', re: /terminate\s+your\s+account|suspend\s+your\s+account|without\s+notice/i, why: 'Your account could be removed with little warning.' }
];

function splitClauses(rawText) {
  return rawText
    .split(/\n+|(?<=[.;])\s+(?=[A-Z])/)
    .map((c) => c.trim())
    .filter(Boolean);
}

function simplifyClause(clause) {
  let simplified = clause;
  legalToPlain.forEach(([pattern, replacement]) => {
    simplified = simplified.replace(pattern, replacement);
  });

  simplified = simplified
    .replace(/\s+/g, ' ')
    .replace(/\b(the company|we)\b/gi, 'the app company')
    .replace(/\b(user|you)\b/gi, 'you')
    .trim();

  if (!/[.!?]$/.test(simplified)) simplified += '.';

  return `This part says: ${simplified}`;
}

function detectRisks(clause, index) {
  return riskRules
    .filter((rule) => rule.re.test(clause))
    .map((rule) => ({
      ...rule,
      clauseNumber: index + 1,
      excerpt: clause.length > 180 ? `${clause.slice(0, 180)}…` : clause
    }));
}

function analyzeText(inputText) {
  const clauses = splitClauses(inputText);
  const mappings = clauses.map((clause, index) => ({
    clauseNumber: index + 1,
    source: clause,
    simplified: simplifyClause(clause)
  }));
  const risks = clauses.flatMap((clause, i) => detectRisks(clause, i));

  return {
    generatedAt: new Date().toISOString(),
    mappings,
    risks
  };
}

function renderReport(report) {
  mappingList.innerHTML = '';
  riskList.innerHTML = '';

  report.mappings.forEach((mapping) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'mapping-row';
    wrapper.innerHTML = `
      <div class="mapping-head">Clause ${mapping.clauseNumber}</div>
      <div class="mapping-body">
        <section class="mapping-col">
          <h3>Source clause</h3>
          <p>${mapping.source}</p>
        </section>
        <section class="mapping-col">
          <h3>Simplified (3rd-grade default)</h3>
          <p>${mapping.simplified}</p>
        </section>
      </div>
    `;
    mappingList.appendChild(wrapper);
  });

  if (report.risks.length === 0) {
    riskList.innerHTML = '<p>No common high-risk patterns were detected.</p>';
  } else {
    report.risks.forEach((risk) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'risk-item';
      wrapper.innerHTML = `
        <div class="risk-title">
          <span>${risk.key}</span>
          <span class="badge ${risk.level}">${risk.level.toUpperCase()}</span>
        </div>
        <p>${risk.why}</p>
        <div class="citation"><strong>Citation:</strong> Clause ${risk.clauseNumber} — “${risk.excerpt}”</div>
      `;
      riskList.appendChild(wrapper);
    });
  }

  results.classList.remove('hidden');
  exportBtn.disabled = false;
}

function exportReport(report) {
  const lines = [
    '# Plain Terms Report',
    `Generated: ${report.generatedAt}`,
    '',
    '## Legal disclaimer',
    'This report is educational only and not legal advice.',
    '',
    '## Source ↔ simplified mapping'
  ];

  report.mappings.forEach((mapping) => {
    lines.push(`- Clause ${mapping.clauseNumber}`);
    lines.push(`  - Source: ${mapping.source}`);
    lines.push(`  - Simplified: ${mapping.simplified}`);
  });

  lines.push('');
  lines.push('## Potentially disadvantageous clauses');

  if (report.risks.length === 0) {
    lines.push('- No common high-risk patterns were detected.');
  } else {
    report.risks.forEach((risk) => {
      lines.push(`- [${risk.level.toUpperCase()}] ${risk.key}`);
      lines.push(`  - Why it matters: ${risk.why}`);
      lines.push(`  - Citation: Clause ${risk.clauseNumber} — "${risk.excerpt}"`);
    });
  }

  lines.push('');
  lines.push('## Legal disclaimer (repeated)');
  lines.push('This report is educational only and not legal advice.');

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plain-terms-report.md';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

analyzeBtn.addEventListener('click', () => {
  const inputText = tosInput.value.trim();
  if (!inputText) {
    alert('Please paste Terms of Service text first.');
    return;
  }

  currentReport = analyzeText(inputText);
  renderReport(currentReport);
});

exportBtn.addEventListener('click', () => {
  if (currentReport) exportReport(currentReport);
});

loadSampleBtn.addEventListener('click', () => {
  tosInput.value = `We may change these Terms at any time by posting an updated version. Your subscription will automatically renew each month unless canceled at least 24 hours before renewal. You agree to resolve disputes by binding arbitration and waive any right to participate in a class action lawsuit. We may disclose personal information to third parties, including affiliates and marketing partners. The service is provided "as is" and we are not liable for indirect or consequential damages. We may suspend or terminate your account without prior written notice.`;
});

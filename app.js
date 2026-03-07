import { createTranslator } from './translator.js';

const analyzeBtn = document.getElementById('analyzeBtn');
const exportBtn = document.getElementById('exportBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const tosInput = document.getElementById('tosInput');
const results = document.getElementById('results');
const mappingList = document.getElementById('mappingList');
const riskList = document.getElementById('riskList');
const aiToggle = document.getElementById('aiToggle');
const aiEndpoint = document.getElementById('aiEndpoint');
const aiApiKey = document.getElementById('aiApiKey');

let currentReport = null;
let translator;

const riskRules = [
  { key: 'Auto-renewal', level: 'high', re: /auto(?:matic)?\s*renew|renew\s+on\s+its\s+own/i, why: 'You may keep getting charged unless you cancel on time.' },
  { key: 'Forced arbitration', level: 'high', re: /arbitration|waive\s+.*class\s+action|no\s+class\s+actions?/i, why: 'You may lose your right to go to court with others.' },
  { key: 'Data sharing', level: 'medium', re: /share\s+.*data|sell\s+.*data|disclose\s+.*information|third\s+part(y|ies)/i, why: 'Your personal data may be shared.' },
  { key: 'Unilateral changes', level: 'medium', re: /may\s+change\s+these\s+terms|update\s+these\s+terms\s+at\s+any\s+time/i, why: 'The company can change rules later.' },
  { key: 'Limited liability', level: 'high', re: /not\s+liable|limited\s+liability|liability\s+.*limited|as\s+is/i, why: 'You may not get paid back if something goes wrong.' },
  { key: 'Account termination', level: 'medium', re: /terminate\s+your\s+account|suspend\s+your\s+account|without\s+notice/i, why: 'Your account could be removed with little warning.' }
];

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function detectLevel(raw) {
  if (/^\d+[.)]/.test(raw)) return 0;
  if (/^\([a-z]\)|^[a-z][.)]/i.test(raw)) return 1;
  if (/^\([ivx]+\)|^[ivx]+[.)]/i.test(raw)) return 1;
  if (/^\([0-9]+\)/.test(raw)) return 2;
  return 0;
}

function splitClauses(rawText) {
  const lines = rawText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const expanded = [];
  lines.forEach((line) => {
    const sentenceParts = line
      .split(/(?<=[.;])\s+(?=[A-Z])/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (sentenceParts.length <= 1) {
      expanded.push(line);
      return;
    }

    sentenceParts.forEach((part) => expanded.push(part));
  });

  return expanded.map((text, idx) => ({
    id: idx + 1,
    text,
    level: detectLevel(text)
  }));
}

async function simplifyClause(clause) {
  const aiConfig = {
    enabled: aiToggle.checked,
    endpoint: aiEndpoint.value.trim(),
    apiKey: aiApiKey.value.trim()
  };

  const aiResult = await translator.aiTranslate(clause.text, aiConfig);
  const localResult = translator.localTranslate(clause.text);

  return aiResult || localResult;
}

function detectRisks(clauseText, clauseNumber) {
  return riskRules
    .filter((rule) => rule.re.test(clauseText))
    .map((rule) => ({
      ...rule,
      clauseNumber,
      excerpt: clauseText.length > 180 ? `${clauseText.slice(0, 180)}…` : clauseText
    }));
}

function attachHierarchy(mappings) {
  const roots = [];
  const stack = [];

  mappings.forEach((item) => {
    const node = { ...item, children: [] };

    while (stack.length && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  });

  return roots;
}

async function analyzeText(inputText) {
  const clauses = splitClauses(inputText);
  const mappings = [];

  for (const clause of clauses) {
    const simplified = await simplifyClause(clause);
    mappings.push({
      clauseNumber: clause.id,
      source: clause.text,
      level: clause.level,
      simplified: simplified.simplified,
      bulletExplanations: simplified.bulletExplanations,
      translationMode: simplified.mode
    });
  }

  const risks = clauses.flatMap((clause) => detectRisks(clause.text, clause.id));

  return {
    generatedAt: new Date().toISOString(),
    mappings,
    tree: attachHierarchy(mappings),
    risks
  };
}

function renderBullets(items) {
  if (!items?.length) return '<li>No short explanation available.</li>';
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function renderTree(nodes, depth = 0) {
  return nodes.map((mapping) => {
    const indentClass = `depth-${Math.min(depth, 3)}`;

    const children = mapping.children?.length
      ? `<ul class="subclause-list">${renderTree(mapping.children, depth + 1)}</ul>`
      : '';

    return `
      <li class="mapping-row ${indentClass}">
        <div class="mapping-head">Clause ${mapping.clauseNumber} <span class="mode">${escapeHtml(mapping.translationMode)}</span></div>
        <div class="mapping-body">
          <section class="mapping-col">
            <h3>Source clause</h3>
            <p>${escapeHtml(mapping.source)}</p>
          </section>
          <section class="mapping-col">
            <h3>Simplified (3rd-grade default)</h3>
            <p>${escapeHtml(mapping.simplified)}</p>
            <h4>Bullet explanation</h4>
            <ul>${renderBullets(mapping.bulletExplanations)}</ul>
          </section>
        </div>
        ${children}
      </li>
    `;
  }).join('');
}

function renderReport(report) {
  mappingList.innerHTML = `<ul class="mapping-tree">${renderTree(report.tree)}</ul>`;
  riskList.innerHTML = '';

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
        <div class="citation"><strong>Citation:</strong> Clause ${risk.clauseNumber} — “${escapeHtml(risk.excerpt)}”</div>
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
    '## Source ↔ simplified mapping with bullet explanations'
  ];

  report.mappings.forEach((mapping) => {
    lines.push(`- Clause ${mapping.clauseNumber}`);
    lines.push(`  - Source: ${mapping.source}`);
    lines.push(`  - Simplified: ${mapping.simplified}`);
    lines.push(`  - Translation mode: ${mapping.translationMode}`);
    lines.push('  - Bullets:');
    mapping.bulletExplanations.forEach((bullet) => lines.push(`    - ${bullet}`));
  });

  lines.push('', '## Potentially disadvantageous clauses');

  if (report.risks.length === 0) {
    lines.push('- No common high-risk patterns were detected.');
  } else {
    report.risks.forEach((risk) => {
      lines.push(`- [${risk.level.toUpperCase()}] ${risk.key}`);
      lines.push(`  - Why it matters: ${risk.why}`);
      lines.push(`  - Citation: Clause ${risk.clauseNumber} — "${risk.excerpt}"`);
    });
  }

  lines.push('', '## Legal disclaimer (repeated)', 'This report is educational only and not legal advice.');

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

analyzeBtn.addEventListener('click', async () => {
  const inputText = tosInput.value.trim();
  if (!inputText) {
    alert('Please paste Terms of Service text first.');
    return;
  }

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'Analyzing...';

  try {
    currentReport = await analyzeText(inputText);
    renderReport(currentReport);
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze text';
  }
});

exportBtn.addEventListener('click', () => {
  if (currentReport) exportReport(currentReport);
});

loadSampleBtn.addEventListener('click', () => {
  tosInput.value = `1. We may change these Terms at any time by posting an updated version.\n(a) Your subscription will automatically renew each month unless canceled at least 24 hours before renewal.\n(b) You agree to resolve disputes by binding arbitration and waive class action rights.\n2. We may disclose personal information to third parties, including affiliates and marketing partners.\n(a) The service is provided as is and we are not liable for indirect damages.\n(b) We may suspend or terminate your account without prior written notice.`;
});

(async function init() {
  translator = await createTranslator();
})();

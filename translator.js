const DEFAULT_AI_TIMEOUT_MS = 6000;

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitIntoBullets(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^[A-Z]/, (c) => c.toLowerCase()));
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

export async function createTranslator() {
  const [legaleseLexicon, grade3] = await Promise.all([
    loadJson('data/lexicons/legalese_to_grade3.json'),
    loadJson('data/lexicons/grade3_preferred_terms.json')
  ]);

  const phraseEntries = Object.entries(legaleseLexicon).sort((a, b) => b[0].length - a[0].length);

  function localTranslate(rawClause) {
    let text = rawClause;

    phraseEntries.forEach(([legal, plain]) => {
      const re = new RegExp(`\\b${escapeRegExp(legal)}\\b`, 'gi');
      text = text.replace(re, plain);
    });

    text = text
      .replace(/\bshall\b/gi, 'must')
      .replace(/\bmay\b/gi, 'can')
      .replace(/\bthe company\b/gi, 'the app company')
      .replace(/\s+/g, ' ')
      .trim();

    if (!/[.!?]$/.test(text)) {
      text += '.';
    }

    const starter = grade3.plainSentenceStarters[0] || 'This part says';
    const simplified = `${starter}: ${text}`;

    return {
      mode: 'local-lexicon',
      simplified,
      bulletExplanations: splitIntoBullets(simplified)
    };
  }

  async function aiTranslate(rawClause, aiConfig) {
    if (!aiConfig?.enabled || !aiConfig.endpoint) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_AI_TIMEOUT_MS);

    try {
      const response = await fetch(aiConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(aiConfig.apiKey ? { Authorization: `Bearer ${aiConfig.apiKey}` } : {})
        },
        body: JSON.stringify({
          task: 'legal_to_grade3',
          targetReadingLevel: 'grade-3',
          text: rawClause,
          outputFormat: 'json'
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data?.simplified) {
        return null;
      }

      return {
        mode: 'ai-endpoint',
        simplified: data.simplified,
        bulletExplanations: Array.isArray(data.bulletExplanations)
          ? data.bulletExplanations
          : splitIntoBullets(data.simplified)
      };
    } catch (_err) {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    localTranslate,
    aiTranslate,
    metadata: {
      legaleseTerms: phraseEntries.length,
      preferredWordCount: grade3.preferredWords?.length || 0
    }
  };
}

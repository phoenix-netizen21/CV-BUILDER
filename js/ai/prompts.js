// js/ai/prompts.js
// Structured prompts with strict fact-preservation rules for AI Humanizer and Analyzer.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CVPrompts = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const FACT_PRESERVATION_RULES = `
CRITICAL FACT PRESERVATION RULES:
1. You MUST NEVER fabricate or hallucinate any facts, jobs, company names, job titles, institutions, degrees, grades, dates, certifications, or technologies not present in the user text.
2. You MUST NOT invent specific metrics, percentages, dollar amounts, or numbers if the user did not supply them. If a metric would strengthen the text, insert a clear placeholder in brackets like [X%] or [increased by X%] rather than inventing numbers.
3. Preserve the core truth and technical substance of the candidate's experience.
4. Return ONLY the polished rewrite without preamble, explanations, or quotes.
`;

  const MODE_INSTRUCTIONS = {
    natural: `
Goal: Make the text sound naturally written, fluent, and conversational yet respectful and polished. Remove robotic phrasing, awkward transitions, and overly formulaic corporate clichés while keeping the language engaging and authentic.
`,
    professional: `
Goal: Elevate the text to executive-grade professional language. Use industry-standard terminology, authoritative tone, and clear business communication. Emphasize accountability and operational excellence.
`,
    concise: `
Goal: Maximize signal-to-noise ratio. Eliminate filler words, redundancies, weak descriptors, and wordy prepositions. Express the same accomplishments in fewer, punchier words while retaining key keywords.
`,
    impact: `
Goal: Transform passive descriptions into achievement-oriented impact statements. Begin with powerful action verbs (e.g., Architected, Spearheaded, Accelerated, Negotiated). Highlight the relationship between action and outcome/deliverable.
`,
    student: `
Goal: Optimize for university students, interns, and recent graduates. Frame coursework, academic projects, leadership roles, and internships with high ambition, quick learning agility, and collaborative spirit without overstating experience.
`,
    voice: `
Goal: Keep the user's authentic style, sentence structure, and tone. Make only subtle grammatical refinements, eliminate typos or awkward syntax, and strengthen weak verbs without rewriting their voice.
`
  };

  function buildHumanizerPrompt(text, mode = 'professional', customInstruction = '') {
    const modePrompt = MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.professional;
    const customPart = customInstruction && customInstruction.trim()
      ? `\nADDITIONAL USER INSTRUCTION:\n${customInstruction.trim()}\n`
      : '';

    return `You are a world-class professional resume editor and career advisor.
Rewrite the following resume text according to these instructions:

${FACT_PRESERVATION_RULES}

MODE: ${mode.toUpperCase()}
${modePrompt}
${customPart}

ORIGINAL TEXT TO REWRITE:
"""
${text.trim()}
"""

POLISHED TEXT:`;
  }

  function buildAnalyzerPrompt(cvJsonSummary) {
    return `You are an executive CV reviewer and ATS specialist.
Analyze this candidate's resume content and provide an objective quality evaluation:

RESUME SUMMARY:
${cvJsonSummary}

Provide your feedback in strict JSON format matching this schema:
{
  "scores": {
    "overall": 84,
    "content": 86,
    "clarity": 82,
    "impact": 78,
    "ats": 88
  },
  "summary": "Brief 2-sentence executive summary of resume strengths and primary weakness.",
  "suggestions": [
    {
      "type": "weak_verb",
      "severity": "medium",
      "sectionId": "sec_experience",
      "message": "Experience section uses passive phrasing.",
      "recommendation": "Replace 'responsible for' with 'Spearheaded' or 'Orchestrated'."
    }
  ]
}

Only return valid parseable JSON. Do NOT claim the resume is guaranteed to pass ATS.`;
  }

  return {
    MODE_INSTRUCTIONS,
    FACT_PRESERVATION_RULES,
    buildHumanizerPrompt,
    buildAnalyzerPrompt
  };
});

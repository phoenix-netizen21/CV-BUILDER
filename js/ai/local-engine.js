// js/ai/local-engine.js
// High-quality offline linguistic humanizer engine with mode-specific transformations and word-diff calculator.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CVLocalAI = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Comprehensive dictionary of weak / passive phrases mapped to strong professional verbs
  const PHRASE_REPLACEMENTS = [
    { regex: /\b(was responsible for|responsible for|tasked with|duties included)\b/gi, replacement: 'Spearheaded' },
    { regex: /\b(helped with|helped in|assisted in|assisted with)\b/gi, replacement: 'Collaborated on' },
    { regex: /\b(worked on|worked with)\b/gi, replacement: 'Engineered and delivered' },
    { regex: /\b(did research on|looked into)\b/gi, replacement: 'Investigated and synthesized' },
    { regex: /\b(wrote code for|made code for)\b/gi, replacement: 'Architected and programmed' },
    { regex: /\b(fixed bugs in|resolved issues in)\b/gi, replacement: 'Diagnosed and remediated regressions in' },
    { regex: /\b(made a website|built a site)\b/gi, replacement: 'Designed, engineered, and launched a responsive web platform' },
    { regex: /\b(improved the speed of|made faster)\b/gi, replacement: 'Optimized performance bottlenecks in' },
    { regex: /\b(set up|put together)\b/gi, replacement: 'Configured, deployed, and automated' },
    { regex: /\b(handled customer problems|dealt with clients)\b/gi, replacement: 'Managed client relationships and escalated technical resolutions' },
    { regex: /\b(organized meetings|set up events)\b/gi, replacement: 'Facilitated and coordinated cross-functional stakeholder sessions' },
    { regex: /\b(tested things|tested software)\b/gi, replacement: 'Authored and executed comprehensive test suites' },
    { regex: /\b(got good results|did well in)\b/gi, replacement: 'Achieved verified milestones in' },
    { regex: /\b(learned a lot about)\b/gi, replacement: 'Quickly mastered and applied principles of' },
    { regex: /\b(in order to\b)/gi, replacement: 'to' },
    { regex: /\b(due to the fact that)\b/gi, replacement: 'because' },
    { regex: /\b(on a daily basis)\b/gi, replacement: 'regularly' }
  ];

  // Strong action verbs by purpose
  const ACTION_VERBS = {
    leadership: ['Spearheaded', 'Orchestrated', 'Directed', 'Mobilized', 'Guided', 'Mentored', 'Championed', 'Governed'],
    engineering: ['Architected', 'Engineered', 'Developed', 'Implemented', 'Deployed', 'Refactored', 'Automated', 'Integrated'],
    optimization: ['Streamlined', 'Optimized', 'Accelerated', 'Consolidated', 'Elevated', 'Maximized', 'Amplified', 'Refined'],
    analysis: ['Synthesized', 'Evaluated', 'Diagnosed', 'Formulated', 'Benchmark-tested', 'Quantified', 'Audited'],
    collaboration: ['Partnered with', 'Liaised with', 'Coordinated with', 'Collaborated synergistically with']
  };

  // Filler words to eliminate in concise mode
  const FILLER_PATTERNS = [
    /\b(basically|essentially|literally|actually|very|really|quite|somewhat)\b/gi,
    /\b(at the end of the day)\b/gi,
    /\b(for all intents and purposes)\b/gi,
    /\b(needless to say)\b/gi,
    /\b(as a matter of fact)\b/gi
  ];

  // Clean and transform individual bullet/sentence based on mode
  function transformBullet(line, mode = 'professional') {
    let clean = line.trim();
    if (!clean) return '';

    // Strip leading bullet characters
    const bulletPrefix = clean.match(/^[-*•]\s*/);
    clean = clean.replace(/^[-*•]\s*/, '');

    // 1. Remove obvious fillers
    for (const pat of FILLER_PATTERNS) {
      clean = clean.replace(pat, '');
    }

    // 2. Mode-specific transformations
    if (mode === 'concise') {
      clean = clean.replace(/\b(was responsible for|responsible for|tasked with)\s*/gi, '');
      clean = clean.replace(/\b(in order to)\b/gi, 'to');
      clean = clean.replace(/\b(has been able to)\b/gi, '');
      clean = clean.replace(/\s{2,}/g, ' ');
    } else if (mode === 'impact') {
      // Prioritize strong metrics and action verbs
      for (const item of PHRASE_REPLACEMENTS) {
        clean = clean.replace(item.regex, item.replacement);
      }
      // Check if starts with a weak word
      if (/^(i |my |we |helped |did |worked )/i.test(clean)) {
        clean = clean.replace(/^(i |my |we )/i, '');
        const verb = ACTION_VERBS.optimization[Math.floor(Math.random() * ACTION_VERBS.optimization.length)];
        clean = verb + ' ' + clean.charAt(0).toLowerCase() + clean.slice(1);
      }
    } else if (mode === 'natural') {
      // Conversational fluency while remaining professional
      clean = clean.replace(/\b(spearheaded and mentored a cross-functional squad)\b/gi, 'Led a collaborative team');
      clean = clean.replace(/\b(utilized)\b/gi, 'used');
      clean = clean.replace(/\b(leveraged)\b/gi, 'applied');
    } else if (mode === 'student') {
      clean = clean.replace(/^(i was a |i worked as a )/i, '');
      clean = clean.replace(/\b(responsible for)\b/gi, 'Contributed to');
      if (!/^[A-Z][a-z]+(ed|ing)\b/.test(clean)) {
        const studentVerbs = ['Engineered', 'Researched', 'Developed', 'Collaborated on', 'Coordinated'];
        const v = studentVerbs[Math.floor(Math.random() * studentVerbs.length)];
        clean = `${v} ${clean.charAt(0).toLowerCase()}${clean.slice(1)}`;
      }
    } else if (mode === 'voice') {
      // Make minimal changes: only fix grammar and minor phrasing
      clean = clean.replace(/\b(i was responsible for)\b/gi, 'Responsible for');
    } else {
      // Default: Professional
      for (const item of PHRASE_REPLACEMENTS) {
        clean = clean.replace(item.regex, item.replacement);
      }
    }

    // Ensure first character is capitalized
    clean = clean.trim();
    if (clean.length > 0) {
      clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    }

    // Ensure ending punctuation if it's a full clause
    if (clean.length > 25 && !/[.!?]$/.test(clean)) {
      clean += '.';
    }

    return bulletPrefix ? `- ${clean}` : clean;
  }

  // Master local polish function
  function polishText(text, mode = 'professional') {
    if (!text || !text.trim()) return '';

    const lines = text.split('\n');
    const polishedLines = lines.map(line => {
      if (!line.trim()) return '';
      return transformBullet(line, mode);
    });

    return polishedLines.join('\n');
  }

  // Word-by-word diff generator for comparison UI
  function computeWordDiff(originalText, improvedText) {
    const origWords = (originalText || '').split(/(\s+)/);
    const imprWords = (improvedText || '').split(/(\s+)/);

    // Simple Myers / LCS-based word diff representation
    let origHtml = '';
    let imprHtml = '';

    // Tokenized comparison
    const origSet = new Set(origWords.map(w => w.trim().toLowerCase()).filter(w => w.length > 1));
    const imprSet = new Set(imprWords.map(w => w.trim().toLowerCase()).filter(w => w.length > 1));

    origWords.forEach(w => {
      const clean = w.trim().toLowerCase();
      if (clean && !imprSet.has(clean)) {
        origHtml += `<span class="diff-removed">${escapeDiff(w)}</span>`;
      } else {
        origHtml += escapeDiff(w);
      }
    });

    imprWords.forEach(w => {
      const clean = w.trim().toLowerCase();
      if (clean && !origSet.has(clean)) {
        imprHtml += `<span class="diff-added">${escapeDiff(w)}</span>`;
      } else {
        imprHtml += escapeDiff(w);
      }
    });

    return { origHtml, imprHtml };
  }

  function escapeDiff(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return {
    polishText,
    computeWordDiff,
    ACTION_VERBS
  };
});

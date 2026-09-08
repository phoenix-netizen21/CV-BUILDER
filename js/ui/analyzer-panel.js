// js/ui/analyzer-panel.js
// Right-Panel AI CV Analyzer: real-time scores, ATS readiness checks, and actionable fix suggestions.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../ai/analyzer.js'),
      require('../state.js')
    );
  } else {
    root.CVAnalyzerPanel = factory(
      root.CVAnalyzer,
      root.CVState
    );
  }
})(typeof self !== 'undefined' ? self : this, function (Analyzer, State) {
  'use strict';

  let containerEl = null;

  function init(container) {
    containerEl = container;

    State.subscribe((cv, action) => {
      // Re-run analysis on significant changes
      if (action === 'load' || action === 'addSection' || action === 'removeSection' || action === 'addItem' || action === 'removeItem') {
        renderPanel();
      }
    });

    renderPanel();
  }

  function renderPanel() {
    if (!containerEl) return;
    const cv = State.getCV();
    if (!cv) return;

    const analysis = Analyzer.analyzeCV(cv);
    const scores = analysis.scores || { overall: 75, content: 75, clarity: 75, impact: 75, ats: 75 };
    const suggestions = analysis.suggestions || [];

    // Helper for score color
    const getScoreColor = (val) => {
      if (val >= 85) return 'score-excellent';
      if (val >= 70) return 'score-good';
      if (val >= 50) return 'score-average';
      return 'score-poor';
    };

    containerEl.innerHTML = `
      <div class="analyzer-panel-wrap">

        <!-- Top Score Summary -->
        <div class="analyzer-score-hero">
          <div class="overall-score-circle ${getScoreColor(scores.overall)}">
            <span class="score-number">${scores.overall}</span>
            <span class="score-total">/100</span>
          </div>
          <div class="overall-score-text">
            <h4>CV Quality Score</h4>
            <p>${getScoreVerdict(scores.overall)}</p>
          </div>
          <button id="btn-refresh-analysis" class="icon-btn-xs refresh-analysis-btn" title="Refresh Analysis">
            <i class="fa-solid fa-arrow-rotate-right"></i>
          </button>
        </div>

        <!-- Sub-Scores Grid -->
        <div class="sub-scores-grid">
          <div class="sub-score-card">
            <div class="sub-score-header">
              <span>Content</span>
              <strong>${scores.content}%</strong>
            </div>
            <div class="score-bar-track"><div class="score-bar-fill" style="width: ${scores.content}%;"></div></div>
          </div>
          <div class="sub-score-card">
            <div class="sub-score-header">
              <span>Clarity</span>
              <strong>${scores.clarity}%</strong>
            </div>
            <div class="score-bar-track"><div class="score-bar-fill" style="width: ${scores.clarity}%;"></div></div>
          </div>
          <div class="sub-score-card">
            <div class="sub-score-header">
              <span>Impact</span>
              <strong>${scores.impact}%</strong>
            </div>
            <div class="score-bar-track"><div class="score-bar-fill" style="width: ${scores.impact}%;"></div></div>
          </div>
          <div class="sub-score-card">
            <div class="sub-score-header">
              <span>ATS Readiness</span>
              <strong>${scores.ats}%</strong>
            </div>
            <div class="score-bar-track"><div class="score-bar-fill" style="width: ${scores.ats}%;"></div></div>
          </div>
        </div>

        <!-- ATS Disclaimer Notice -->
        <div class="ats-disclaimer-note">
          <i class="fa-solid fa-circle-info"></i>
          <span>Scoring reflects best practices and standard ATS parsing rules. Actual recruiter screening software may vary.</span>
        </div>

        <!-- Actionable Suggestions -->
        <div class="analyzer-suggestions-container">
          <h4 class="suggestions-heading">
            <i class="fa-solid fa-list-check"></i> Actionable Suggestions (${suggestions.length})
          </h4>
          <div class="suggestions-list">
            ${suggestions.map(sug => `
              <div class="suggestion-item suggestion-${escapeAttr(sug.severity || 'info')}">
                <div class="sug-header">
                  <span class="sug-badge sug-badge-${escapeAttr(sug.severity || 'info')}">
                    ${getSeverityIcon(sug.severity)} ${escapeHtml(sug.title)}
                  </span>
                  ${sug.fixAction ? `
                    <button class="sug-jump-btn" data-fix-action="${escapeAttr(sug.fixAction)}">
                      Jump to Fix <i class="fa-solid fa-arrow-right"></i>
                    </button>
                  ` : ''}
                </div>
                <div class="sug-body">${escapeHtml(sug.message)}</div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    // Bindings
    containerEl.querySelector('#btn-refresh-analysis').addEventListener('click', () => {
      renderPanel();
    });

    // Jump to fix buttons
    containerEl.querySelectorAll('.sug-jump-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.fixAction;
        handleJumpToFix(action);
      });
    });
  }

  function handleJumpToFix(action) {
    if (action === 'personal') {
      const card = document.querySelector('.editor-card[data-section-id="personal"]');
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        card.classList.add('open');
      }
    } else if (action === 'add_summary') {
      State.addSection('summary');
    } else if (action === 'add_education') {
      State.addSection('education');
    } else {
      // action is a sectionId
      const card = document.querySelector(`.editor-card[data-section-id="${action}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        card.classList.add('open');
        card.classList.add('card-highlight-flash');
        setTimeout(() => card.classList.remove('card-highlight-flash'), 1200);
      }
    }
  }

  function getScoreVerdict(score) {
    if (score >= 88) return 'Outstanding — Highly ATS-aligned';
    if (score >= 75) return 'Good Foundation — A few areas to polish';
    if (score >= 60) return 'Needs Work — Add metrics and action verbs';
    return 'Incomplete — Missing essential contact and role details';
  }

  function getSeverityIcon(sev) {
    if (sev === 'danger') return '<i class="fa-solid fa-circle-xmark"></i>';
    if (sev === 'warning') return '<i class="fa-solid fa-triangle-exclamation"></i>';
    if (sev === 'success') return '<i class="fa-solid fa-circle-check"></i>';
    return '<i class="fa-solid fa-circle-info"></i>';
  }

  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return {
    init,
    renderPanel
  };
});

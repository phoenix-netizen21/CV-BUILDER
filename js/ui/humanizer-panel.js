// js/ui/humanizer-panel.js
// Right-Panel AI Humanizer comparison interface: modes, diff viewer, apply, reject, regenerate.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../ai/humanizer.js'),
      require('../state.js'),
      require('./toast.js')
    );
  } else {
    root.CVHumanizerPanel = factory(
      root.CVHumanizer,
      root.CVState,
      root.CVToast
    );
  }
})(typeof self !== 'undefined' ? self : this, function (Humanizer, State, Toast) {
  'use strict';

  let containerEl = null;
  let activeTarget = null; // { sectionId, fieldName, itemId, targetInput }
  let currentResult = null; // { original, suggested, mode, origDiff, imprDiff }
  let showDiffView = false;
  let isGenerating = false;

  function init(container) {
    containerEl = container;
    renderPanel();
  }

  function setTarget(targetData) {
    activeTarget = targetData;
    currentResult = null;
    showDiffView = false;
    renderPanel();

    // Auto-populate original text and run initial humanize
    const originalText = targetData.text || '';
    if (originalText.trim()) {
      runHumanize(originalText);
    }
  }

  function renderPanel() {
    if (!containerEl) return;

    const originalVal = currentResult ? currentResult.original : (activeTarget ? activeTarget.text : '');
    const suggestedVal = currentResult ? currentResult.suggested : '';
    const selectedMode = currentResult ? currentResult.mode : 'professional';

    containerEl.innerHTML = `
      <div class="humanizer-panel-wrap">
        <div class="humanizer-header">
          <div class="humanizer-title-row">
            <span class="humanizer-title"><i class="fa-solid fa-wand-magic-sparkles sparkle-icon"></i> AI Humanizer</span>
            <span class="fact-guarantee-badge" title="Factual preservation active: No metrics or jobs will be fabricated.">
              <i class="fa-solid fa-shield-check"></i> Fact Preserved
            </span>
          </div>
          <p class="humanizer-desc">Refine CV bullet points and descriptions for tone, impact, and clarity while strictly preserving your authentic facts.</p>
        </div>

        <!-- Mode Selector -->
        <div class="humanizer-mode-box">
          <label for="humanizer-mode-select">Optimization Mode:</label>
          <select id="humanizer-mode-select" class="form-control">
            <option value="professional" ${selectedMode === 'professional' ? 'selected' : ''}>💼 Professional (Authoritative, standard)</option>
            <option value="impact" ${selectedMode === 'impact' ? 'selected' : ''}>🚀 Impact-Focused (Action verbs, metrics)</option>
            <option value="concise" ${selectedMode === 'concise' ? 'selected' : ''}>✂️ Concise (Eliminates filler & fluff)</option>
            <option value="natural" ${selectedMode === 'natural' ? 'selected' : ''}>🌱 Natural (Engaging, authentic voice)</option>
            <option value="student" ${selectedMode === 'student' ? 'selected' : ''}>🎓 Student / Intern (Early-career focus)</option>
            <option value="voice" ${selectedMode === 'voice' ? 'selected' : ''}>🎯 Keep My Voice (Subtle grammar fix)</option>
          </select>
        </div>

        <!-- Custom Prompt Instruction (Optional) -->
        <div class="humanizer-custom-box">
          <input type="text" id="humanizer-custom-prompt" class="form-control" placeholder="Optional instruction (e.g. emphasize cloud technologies)" />
        </div>

        <!-- Comparison Interface (Original vs Suggested) -->
        <div class="comparison-container">
          <!-- Left: Original -->
          <div class="comparison-col">
            <div class="col-header">
              <span class="col-label">ORIGINAL</span>
              <span class="char-count">${originalVal.length} chars</span>
            </div>
            <div class="col-content-box">
              <textarea id="humanizer-original-input" class="comparison-textarea" placeholder="Paste or type text to polish...">${escapeHtml(originalVal)}</textarea>
            </div>
          </div>

          <!-- Right: Suggested -->
          <div class="comparison-col">
            <div class="col-header">
              <span class="col-label">SUGGESTED</span>
              ${currentResult ? `
                <div class="col-header-tools">
                  <button id="btn-toggle-diff" class="diff-toggle-btn ${showDiffView ? 'active' : ''}" title="Toggle visual difference highlight">
                    <i class="fa-solid fa-code-compare"></i> Diff
                  </button>
                  <button id="btn-copy-suggested" class="copy-btn" title="Copy suggested text">
                    <i class="fa-solid fa-copy"></i>
                  </button>
                </div>
              ` : ''}
            </div>
            <div class="col-content-box suggested-box">
              ${isGenerating ? `
                <div class="humanizer-loading-state">
                  <i class="fa-solid fa-circle-notch fa-spin loading-spinner"></i>
                  <span>Polishing content...</span>
                </div>
              ` : showDiffView && currentResult ? `
                <div class="diff-view-output">${currentResult.imprDiff}</div>
              ` : `
                <textarea id="humanizer-suggested-output" class="comparison-textarea" placeholder="Click 'Humanize Text' to generate polish..." ${currentResult ? '' : 'readonly'}>${escapeHtml(suggestedVal)}</textarea>
              `}
            </div>
          </div>
        </div>

        <!-- Action Bar -->
        <div class="humanizer-actions-bar">
          <button id="btn-run-humanize" class="primary-btn" ${isGenerating ? 'disabled' : ''}>
            <i class="fa-solid ${isGenerating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}"></i>
            ${currentResult ? 'Regenerate' : 'Humanize Text'}
          </button>

          ${currentResult ? `
            <button id="btn-apply-humanize" class="success-btn" title="Apply changes directly to CV">
              <i class="fa-solid fa-check"></i> Apply Changes
            </button>
            <button id="btn-reject-humanize" class="ghost-btn" title="Dismiss suggestion">
              <i class="fa-solid fa-xmark"></i> Dismiss
            </button>
          ` : ''}
        </div>

        <!-- Action Verbs Quick Inserter -->
        <div class="action-verbs-quick-bar">
          <span class="verbs-quick-title"><i class="fa-solid fa-bolt"></i> Power Verbs:</span>
          <div class="quick-verbs-list">
            <span class="quick-verb-chip">Spearheaded</span>
            <span class="quick-verb-chip">Architected</span>
            <span class="quick-verb-chip">Optimized</span>
            <span class="quick-verb-chip">Automated</span>
            <span class="quick-verb-chip">Orchestrated</span>
            <span class="quick-verb-chip">Accelerated</span>
            <span class="quick-verb-chip">Engineered</span>
          </div>
        </div>

      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    const runBtn = containerEl.querySelector('#btn-run-humanize');
    const origInput = containerEl.querySelector('#humanizer-original-input');
    const modeSelect = containerEl.querySelector('#humanizer-mode-select');
    const customPrompt = containerEl.querySelector('#humanizer-custom-prompt');

    if (runBtn && origInput) {
      runBtn.addEventListener('click', () => {
        const text = origInput.value.trim();
        if (!text) {
          Toast.warning('Please provide some text to polish.');
          return;
        }
        runHumanize(text, modeSelect.value, customPrompt.value);
      });
    }

    const applyBtn = containerEl.querySelector('#btn-apply-humanize');
    if (applyBtn) {
      applyBtn.addEventListener('click', applyChanges);
    }

    const rejectBtn = containerEl.querySelector('#btn-reject-humanize');
    if (rejectBtn) {
      rejectBtn.addEventListener('click', () => {
        currentResult = null;
        showDiffView = false;
        renderPanel();
      });
    }

    const copyBtn = containerEl.querySelector('#btn-copy-suggested');
    if (copyBtn && currentResult) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(currentResult.suggested).then(() => {
          Toast.success('Suggested text copied to clipboard!');
        }).catch(() => {
          Toast.error('Could not copy to clipboard.');
        });
      });
    }

    const diffBtn = containerEl.querySelector('#btn-toggle-diff');
    if (diffBtn) {
      diffBtn.addEventListener('click', () => {
        showDiffView = !showDiffView;
        renderPanel();
      });
    }

    // Quick verbs click to insert into original
    containerEl.querySelectorAll('.quick-verb-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const verb = chip.innerText.trim();
        if (origInput) {
          const val = origInput.value;
          origInput.value = verb + ' ' + val;
          origInput.focus();
        }
      });
    });
  }

  async function runHumanize(text, mode = null, customInstruction = '') {
    const selectedMode = mode || (containerEl.querySelector('#humanizer-mode-select')?.value || 'professional');

    isGenerating = true;
    renderPanel();

    try {
      const result = await Humanizer.humanize(text, {
        mode: selectedMode,
        customInstruction: customInstruction
      });

      currentResult = result;
      Toast.success(`Polished using ${result.mode} mode (${result.provider}).`);
    } catch (err) {
      console.error(err);
      Toast.error(err.message || 'Humanizing failed.');
    } finally {
      isGenerating = false;
      renderPanel();
    }
  }

  function applyChanges() {
    if (!currentResult || !currentResult.suggested) return;
    const finalPolished = currentResult.suggested;

    if (activeTarget && activeTarget.targetInput) {
      // Update DOM input directly
      activeTarget.targetInput.value = finalPolished;

      // Update State
      if (activeTarget.sectionId === 'personal') {
        State.updatePersonal(activeTarget.fieldName, finalPolished);
      } else if (activeTarget.itemId) {
        State.updateSectionItem(activeTarget.sectionId, activeTarget.itemId, activeTarget.fieldName, finalPolished);
      } else if (activeTarget.fieldName === 'content') {
        State.updateSectionContent(activeTarget.sectionId, finalPolished);
      }

      Toast.success('Applied improved text to CV!');
    } else {
      // If no active target was selected, copy to clipboard
      navigator.clipboard.writeText(finalPolished);
      Toast.success('No target field selected: Copied to clipboard.');
    }

    currentResult = null;
    showDiffView = false;
    renderPanel();
  }

  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return {
    init,
    setTarget,
    renderPanel
  };
});
